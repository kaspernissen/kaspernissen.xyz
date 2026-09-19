---
title: "Setting up a Highly Available Kubernetes Cluster with private networking on AWS using Kops"
date: 2017-01-30
summary: "This is the first post in a series of Kubernetes and Kubernetes Operations (Kops) related blog posts."
tags: ["cloud-native", "aws", "kops", "kubernetes"]
canonical: "https://medium.com/kubecloud/setting-up-a-highly-available-kubernetes-cluster-with-private-networking-on-aws-using-kops-65f7a94782ef"
source: medium
---
This is the first post in a series of Kubernetes and Kubernetes Operations (Kops) related blog posts.

The purpose of this series is to provide a guide to setting up a production ready Kubernetes environment on AWS. There exists lots of options to accomplish this; among others, Techtonic, Kismatic, StackPoint Cloud, OpenShift, etc. In this post we will have a look at the open source tool; Kubernetes Operations — also called Kops. Kops seems to have gained a lot of traction, and the community around the project is very active. Thanks to all maintainers for their hard work!

### Prerequisites

In order to follow along with this guide, you need a couple of tools and an AWS account.

- An AWS account and cli
- Kops installed on you machine v1.5.1
- kubectl

This tutorial is tested on macOS. I don’t know whether there exists Windows support for Kops, yet.

Before we get our hands dirty, let’s draw up the setup we would like to build. Since the closest AWS Region to my location is Ireland, I will continue this tutorial with eu-west-1. You can, of course, choose the region closest to your geographic location. If you are not familiar with AWS, and especially AWS Networking, I recommend you to read up on the basics of this topic. Terms you will need knowledge about are:

- Virtual Private Cloud
- Subnets
- Route Tables
- Internet Gateway
- NAT Gateway

I will try to explain these terms vaguely going through the tutorial.

Alright, this is what we want to accomplish.

First, we want to create a VPC with a CIDR block of our choice. I chose to use 10.0.0.0/16. Read the guidelines for defining CIDR blocks on AWS before choosing.

Within this VPC, I want all my nodes to be placed on a private network without any Public IPs. This limits the surface area of attack by not making the nodes reachable from the Internet directly.

Further, I want to make this setup production ready. I want nodes spread across availability zones (physically located AWS datacenters) to make sure the Kubernetes cluster will survive a disturbance in one of the zones. I use the 3 available zones in eu-west, called eu-west-1a, eu-west-1b, eu-west-1c.

Even though we don’t want our instances to be reachable from the public internet, we need the private instances to be able to reach the internet. In order to accomplish this, we have to create 3 NAT Gateway nodes; one for each private zone. The NAT Gateway allows private instances to communicate with the internet.

This tutorial can be used as a reference guide to how you can use Kops with an already set up VPC with subnets, NAT Gateways, etc. Before I can show you how you can use Kops with an existing setup, we need our own setup. Let’s set up the networking in AWS.

### Setting up the VPC in AWS

If you haven’t already installed the awscli tool, go ahead and do it now. We will use the awscli tool extensively to create our network.

If you have multiple keys defined for the awscli tool in ~/.aws/credentials, set the profile for the AWS account you want to use.

```bash
$ export AWS_DEFAULT_PROFILE=kni_private
```

or, just run the aws configure.

Let’s create the VPC. As mentioned earlier and shown in the diagram, I chose the cidr-block 10.0.0.0/16.

```bash
$ aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region eu-west-1 { "Vpc": { "VpcId": "vpc-a55e77c1", "InstanceTenancy": "default", "Tags": [], "State": "pending", "DhcpOptionsId": "dopt-b8ee9cdd", "CidrBlock": "10.0.0.0/16", "IsDefault": false } }
```

Modify the VPC to allow DNS hostnames by running the following command:

```bash
$ aws ec2 modify-vpc-attribute --vpc-id <VPC_ID> --enable-dns-hostnames "{\"Value\":true}" --region eu-west-1
```

Next, we need an Internet Gateway, let’s go ahead and create one.

```bash
$ aws ec2 create-internet-gateway --region eu-west-1
```

The last thing, we need to configure in terms of the VPC and Internet Gateway is to attach the internet gateway to the VPC.

```bash
$ aws ec2 attach-internet-gateway --internet-gateway-id <INTERNET_GATEWAY_ID> --vpc-id <VPC_ID> --region eu-west-1
```

Now, the VPC is set up. Next up is configuring the subnets we want to use.

As depicted in the diagram, I want 3 public subnets and 3 private subnets. Meaning a public and private subnet in each Availability Zone. Let’s go ahead and start with the public subnets.

**Public subnets**

For each of the three public zones repeat the following two commands. Remember to use the selected CIDR-block for each zone. In this example, we will use; 10.0.0.0/20 for the subnet in eu-west-1a; 10.0.16.0/20 for the subnet in eu-west-1b; 10.0.32.0/20 for the subnet in eu-west-1c.

```bash
$ aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block <CIDR_BLOCK> --availability-zone <AVAILABILITY_ZONE> --region eu-west-1
```

Further, we want the public subnets to auto-assign public ip to instances. Let’s modify the subnet.

```bash
$ aws ec2 modify-subnet-attribute --subnet-id <SUBNET_ID> --map-public-ip-on-launch --region eu-west-1
```

Repeat this for the rest of the public subnets.

**Private subnets**

Like before, we need 3 subnets. Let’s just go ahead and create them. The private subnets we will use are; 10.0.48.0/20 for eu-west-1a; 10.0.64.0/20 for eu-west-1b; 10.0.80.0/20 for eu-west-1c.

```bash
$ aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block <CIDR_BLOCK> --availability-zone <AVAILABILITY_ZONE> --region eu-west-1
```

Again, repeat this for all the private subnets. Great! Now, we have 6 subnets, 3 private, and 3 public. Let’s move on by making the private subnets able to connect to the internet.

### Setting up the NAT Gateways in AWS

We will, as described earlier, create 3 NAT Gateways. Since these NAT Gateways should connect to the public Internet, we also need to allocate 3 Elastic IPs.

```bash
$ aws ec2 allocate-address --domain vpc --region eu-west-1
```

Use the AllocationId to create the NAT Gateway for the public zone in eu-west-1a:

```bash
$ aws ec2 create-nat-gateway --subnet-id <SUBNET_ID> --allocation-id <ALLOCATION_ID> --region eu-west-1
```

Do the same for the 2 other public subnets.

We are almost there, the last thing on our agenda is to define the routes in our networking. Let’s go ahead and configure the Route Tables.

### Configuring the Route Tables

Let’s start with the Route Table for the 3 public zones. We can join the routes for the three public subnets in one Route Table and then associate the three public subnets to this Route Table.

**Public Route Table**

First, we create the Route Table.

```bash
$ aws ec2 create-route-table --vpc-id <VPC_ID> --region eu-west-1
```

Next, we create a route for the Internet Gateway, we previously created. Use the outputted Route Table ID as follows.

```bash
$ aws ec2 create-route --route-table-id <ROUTE_TABLE_ID> --destination-cidr-block 0.0.0.0/0 --gateway-id <INTERNET_GATEWAY_ID> --region eu-west-1
```

Lastly, let’s associate our public subnets with the Route Table.

```bash
$ aws ec2 associate-route-table --route-table-id <ROUTE_TABLE_ID> --subnet-id <SUBNET_ID> --region eu-west-1
```

Repeat this last step for the 3 public subnets.

**Private Route Tables**

Next, we have to create a Route Table for each of our 3 private zones.

```bash
$ aws ec2 create-route-table --vpc-id <VPC_ID> --region eu-west-1
```

Create the route that points to our NAT Gateway.

```bash
$ aws ec2 create-route --route-table-id <ROUTE_TABLE_ID> --destination-cidr-block 0.0.0.0/0 --nat-gateway-id <NAT_GATEWAY_ID> --region eu-west-1
```

Associate the subnet (be sure to connect the right subnet matching the availability zone of the NAT Gateway)

```bash
$ aws ec2 associate-route-table --route-table-id <ROUTE_TABLE_ID> --subnet-id <SUBNET_ID> --region eu-west-1
```

Repeat the process for the last 2 private subnets as well.

Great! Now the initial AWS Networking is in place, and we are ready to go on!

### Setting up DNS in AWS Route53

I had already configured my AWS Route53 with my domain as a public hosted zone. If you haven’t you can follow the guide provided by Kris Nova at [Link](https://www.nivenly.com/).

You need to set up a public hosted zone with your domain, and have your provider point to AWS DNS name servers. You can verify that this is the case by calling the following, and verify that the AWS DNS nameservers are responding.

```bash
$ dig phennex.com NS ; <<>> DiG 9.8.3-P1 <<>> phennex.com NS ;; global options: +cmd ;; Got answer: ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 39791 ;; flags: qr rd ra; QUERY: 1, ANSWER: 4, AUTHORITY: 0, ADDITIONAL: 0 ;; QUESTION SECTION: ;phennex.com. IN NS ;; ANSWER SECTION: phennex.com. 86399 IN NS ns-1252.awsdns-28.org. phennex.com. 86399 IN NS ns-1738.awsdns-25.co.uk. phennex.com. 86399 IN NS ns-251.awsdns-31.com. phennex.com. 86399 IN NS ns-822.awsdns-38.net. ;; Query time: 106 msec ;; SERVER: 8.8.8.8#53(8.8.8.8) ;; WHEN: Sun Jan 29 20:47:20 2017 ;; MSG SIZE rcvd: 166
```

You also have to set up a private hosted zone for your domain. Again, this was already setup in my account. The easy way to do this is by going to the Route53 in the web-console. Press Create Hosted Zone, enter the same domain as the public zone, and choose the type to be private and associate your VPC from the dropdown-list.

### Creating an S3 Bucket as Kops state store

We need a place to store our cluster configuration, and S3 is the place that Kops uses. 
 Create a bucket. Choose a name for the bucket. I use: --bucket kubecloud-state-store.

```bash
$ aws s3api create-bucket --bucket kubecloud-state-store --region eu-west-1
```

### Installing Kops

Private networking and setting up a cluster in an existing VPC just entered the stable channel. Therefore, go ahead and fetch Kops 1.5.1. [Kops Releases](https://github.com/kubernetes/kops/releases)

Download the darwin binary and move it to your PATH.

```bash
$ mv kops-darwin-amd64 /usr/local/bin/kops
```

```bash
$ chmod +x /usr/local/bin/kops
```

Verify that the version is installed correctly

```bash
$ kops version Version 1.5.1 (git-01deca8)
```

**Create the HA Cluster with Kops**

Yeah! Now we are ready to create our High Available Kubernetes cluster. Awesome! Let’s make things a bit easier by storing some of our configuration in ENV variables.

```
export NAME=<CLUSTER_NAME> export KOPS_STATE_STORE=s3://<BUCKET_NAME> export VPC_ID=<VPC_ID> export DNS_ZONE_PRIVATE_ID=<ID_OF_PRIVATE_HOSTED_ZONE>
```

Let’s use Kops to create the cluster.

```
kops create cluster \ --node-count 3 \ --zones eu-west-1a,eu-west-1b,eu-west-1c \ --master-zones eu-west-1a,eu-west-1b,eu-west-1c \ --dns-zone=${DNS_ZONE_PRIVATE_ID} \ --dns private \ --node-size t2.medium \ --master-size t2.small \ --topology private \ --networking weave \ --vpc=${VPC_ID} \ --bastion \ ${NAME}
```

--node-count defines the number of nodes. I chose the node-count to be 3.

--zones and --master-zones defines the zones we would like to span. As described earlier we chose; eu-west-1a, eu-west-1b, eu-west-1c. Both for the masters and the worker nodes.

--dns-zones the id of the private zone to use.

--dns private defines that we want to use a private hosted zone.

--node-size and --master-size defines the instance types we want yo use.

--topology private specifies that we want our nodes to be in the private subnets.

--networking weave defines the network to be used. Select the network you want to use. See available options at [this link](https://github.com/kubernetes/kops/blob/master/docs/networking.md).

--vpc the vpc id to use.

--bastion tells Kops that we want a bastion jump server in our cluster. This allows us to inspect the nodes via SSH.

**Edit the cluster**

Edit the cluster to match the networking we setup before.

```bash
$ kops edit cluster ${NAME}
```

Change the subnet configuration as follows:

```
subnets: - id: subnet-0e89f256 egress: nat-0b80a9c336c8e4e4b name: eu-west-1a type: Private zone: eu-west-1a - id: subnet-c3320ca7 egress: nat-0eed67fdd1d1a2b72 name: eu-west-1b type: Private zone: eu-west-1b - id: subnet-c09dafb6 egress: nat-0c297125cb75a6995 name: eu-west-1c type: Private zone: eu-west-1c - id: subnet-4d89f215 name: utility-eu-west-1a type: Utility zone: eu-west-1a - id: subnet-e4320c80 name: utility-eu-west-1b type: Utility zone: eu-west-1b - id: subnet-e09daf96 name: utility-eu-west-1c type: Utility zone: eu-west-1c
```

Now, run kops update cluster ${NAME}. You should see output similar to the following:

```
... ... Will modify resources: VPC/kubecloud.phennex.com Name <nil> -> kubecloud.phennex.com InternetGateway/kubecloud.phennex.com Name <nil> -> kubecloud.phennex.com Subnet/utility-eu-west-1c.kubecloud.phennex.com Name <nil> -> utility-eu-west-1c.kubecloud.phennex.com Subnet/eu-west-1b.kubecloud.phennex.com Name <nil> -> eu-west-1b.kubecloud.phennex.com Subnet/utility-eu-west-1a.kubecloud.phennex.com Name <nil> -> utility-eu-west-1a.kubecloud.phennex.com Subnet/eu-west-1a.kubecloud.phennex.com Name <nil> -> eu-west-1a.kubecloud.phennex.com Subnet/utility-eu-west-1b.kubecloud.phennex.com Name <nil> -> utility-eu-west-1b.kubecloud.phennex.com Subnet/eu-west-1c.kubecloud.phennex.com Name <nil> -> eu-west-1c.kubecloud.phennex.com Must specify --yes to apply changes
```

When you are satisfied with the things that Kops wants to create, run the following. It’s a known issue that Kops tells that it will modify the name of the VPC, InternetGateway, etc. This will actually not happen.

```bash
$ kops update cluster ${NAME} --yes
```

Since, we specified the cluster to use a private hosted zone, the cluster will only be accessible from within AWS.

We therefore need to make a little workaround and use the public zone we created earlier.

As you can see, Kops has created some records in Route53 in the private zone.

![](/blog-images/setting-up-a-highly-available-kubernetes-cluster-with-private-networking-on-aws-using-kops-01.png)

The 2 records we want to be resolvable from the public internet are:

api.kubecloud.phennex.com and bastion.kubecloud.phennex.com

Let’s created them in the public zone instead. Go to the public zone, press Create Record Set enter: *api.your_domain* and choose an A-record, and tick Yes to *Alias* find the api loadbalancer in the list. Repeat for the bastion server as well.

Finally delete the 2 records in the private zone.

### Verifying the cluster works

We can now verify that we are able to connect to the cluster using kubectl

```bash
$ kubectl get nodes NAME STATUS AGE ip-10-0-52-26.eu-west-1.compute.internal Ready,master 3m ip-10-0-56-14.eu-west-1.compute.internal Ready 2m ip-10-0-68-38.eu-west-1.compute.internal Ready 2m ip-10-0-76-65.eu-west-1.compute.internal Ready,master 3m ip-10-0-80-53.eu-west-1.compute.internal Ready,master 3m ip-10-0-94-201.eu-west-1.compute.internal Ready 2m
```

### SSH into the private nodes

If you need access to you instances, you can always SSH into the bastion server and jump to all the instances from here.

```bash
$ ssh-add ~/.ssh/id_rsa $ ssh -A admin@bastion.kubecloud.phennex.com $ ssh admin@<PRIVATE_IP_OF_INSTANCE>
```

This was the first post in a series of blog posts about running Kubernetes on AWS using Kops.

I hope you like it — happy hacking!

*Originally published at* [kubecloud.io](http://kubecloud.io/setup-ha-k8s-kops/) *on January 30, 2017.*

---

[Setting up a Highly Available Kubernetes Cluster with private networking on AWS using Kops](https://medium.com/kubecloud/setting-up-a-highly-available-kubernetes-cluster-with-private-networking-on-aws-using-kops-65f7a94782ef) was originally published in [kubecloud](https://medium.com/kubecloud) on Medium, where people are continuing the conversation by highlighting and responding to this story.
