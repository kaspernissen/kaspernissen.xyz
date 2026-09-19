---
title: "HA Kubernetes Cluster on AWS? — Kops makes it easy"
date: 2017-03-12
summary: "In the first post of our mini-series about Kops, I demonstrated how you could set up a highly available Kubernetes cluster on AWS in an existing VPC leveraging the awesome open-source project Kops."
tags: ["kubernetes", "kops", "aws", "cloud-native"]
canonical: "https://medium.com/kubecloud/ha-kubernetes-cluster-on-aws-kops-makes-it-easy-2337806d0311"
source: medium
---
In the first [post](http://kubecloud.io/setup-ha-k8s-kops/) of our mini-series about Kops, I demonstrated how you could set up a highly available Kubernetes cluster on AWS in an existing VPC leveraging the awesome open-source project Kops.

In order to demonstrate how this could be accomplished, I demonstrated how to set up all the networking, with VPC, subnets, route tables, etc. This may have skewed people’s understanding of the ease of use of Kops. This was not the intention.

However, I think the post demonstrated an actual use-case that many people migrating to Kubernetes on AWS is facing. At least it was the requirements I was facing in our migration path towards Kubernetes. We already had multiple services running in a VPC, like RDS databases, VPN connections, etc. The Kubernetes cluster, therefore, had to be spun up within this VPC in order to be able to communicate with the already existing services using private IPs.

Therefore, to show some of the magic that Kops can do, I will write this follow-up post showing you how fast you can get up and running with a highly available Kops cluster similar to the previous post.

As in the previous post, we want a highly available cluster spread across multiple availability zones, along with private networking to ensure a closed environment. The following diagram illustrates the setup we would like to accomplish.

![](/blog-images/ha-kubernetes-cluster-on-aws-kops-makes-it-easy-01.png)

There are a couple of prerequisites that need to be in place before we can spin up our cluster. First, you need an AWS Account, a domain, Kops, awscli (not necessary since you can do the same in the console).

In this post, I will assume that you already have a perfectly working AWS account and that you have configured Route53 to handle DNS for your domain. (if this is not the case, check out the official documentation of kops [here.](https://github.com/kubernetes/kops/blob/master/docs/aws.md))

Great! Let’s get going.

The first thing you have to do is to set up a bucket that Kops will use to store the cluster state. I will create this bucket using the awscli tool, but feel free to create it using the console.

```bash
$ aws s3api create-bucket --bucket kubecloud-phennex-state-store --region eu-west-1
```

You should use versioning, especially when running in production. This enables you to revert you state to an earlier version.

```bash
$ aws s3api put-bucket-versioning --bucket kubecloud-phennex-state-store --versioning-configuration Status=Enabled
```

In the following I will be using Kops 1.5.3. (You can download it [here](https://github.com/kubernetes/kops/releases))

**Lets create the HA Cluster with Kops…**

Yeah! Now we are ready to create our Highly Available Kubernetes cluster. Awesome! Let’s make things a bit easier by storing some of our configuration in ENV variables.

```
export NAME=<CLUSTER_NAME> export KOPS_STATE_STORE=s3://<BUCKET_NAME> export DNS_ZONE_PRIVATE_ID=<ID_OF_PRIVATE_HOSTED_ZONE>
```

Let’s use Kops to create the cluster.

```
kops create cluster \ --node-count 3 \ --zones eu-west-1a,eu-west-1b,eu-west-1c \ --master-zones eu-west-1a,eu-west-1b,eu-west-1c \ --dns-zone=${DNS_ZONE_PRIVATE_ID} \ --dns private \ --node-size t2.medium \ --master-size t2.small \ --topology private \ --networking weave \ --bastion \ ${NAME}
```

--node-count defines the number of nodes. I chose the node-count to be 3.

--zones and --master-zones defines the zones we would like to span. As described earlier we chose; eu-west-1a, eu-west-1b, eu-west-1c. Both for the masters and the worker nodes.

--dns-zones the id of the private zone to use.

--dns private defines that we want to use a private hosted zone.

--node-size and --master-size defines the instance types we want yo use.

--topology private specifies that we want our nodes to be in the private subnets.

--networking weave defines the network to be used. Select the network you want to use. See available options at [this link](https://github.com/kubernetes/kops/blob/master/docs/networking.md).

--bastion tells Kops that we want a bastion jump server in our cluster. This allows us to inspect the nodes via SSH.

**Be aware,** that Kubernetes recommends running m3 instances for production usage. However, for demonstration purpose I will use cheaper instances.

You can always dry-run your cluster configuration with:

```
kops update cluster ${NAME}
```

This command will output what Kops intent to do, and you should verify that everything looks as expected. You can always edit this configuration with kops edit cluster ${NAME}

Once, you are ready to go, run the following command:

```
kops update cluster ${NAME} --yes
```

You should see something similar to this:

```bash
$ kops update cluster ${NAME} --yes I0312 19:22:21.016372 15912 dns.go:90] Private DNS: skipping DNS validation I0312 19:22:23.297797 15912 executor.go:91] Tasks: 0 done / 112 total; 34 can run I0312 19:22:24.297299 15912 vfs_castore.go:422] Issuing new certificate: "kubecfg" I0312 19:22:24.386945 15912 vfs_castore.go:422] Issuing new certificate: "master" I0312 19:22:24.824109 15912 vfs_castore.go:422] Issuing new certificate: "kubelet" I0312 19:22:26.683630 15912 executor.go:91] Tasks: 34 done / 112 total; 27 can run I0312 19:22:29.562652 15912 executor.go:91] Tasks: 61 done / 112 total; 34 can run I0312 19:22:30.127307 15912 launchconfiguration.go:310] waiting for IAM instance profile "bastions.kubecloud.phennex.com" to be ready I0312 19:22:30.693262 15912 launchconfiguration.go:310] waiting for IAM instance profile "masters.kubecloud.phennex.com" to be ready I0312 19:22:30.903973 15912 launchconfiguration.go:310] waiting for IAM instance profile "masters.kubecloud.phennex.com" to be ready I0312 19:22:30.915987 15912 launchconfiguration.go:310] waiting for IAM instance profile "nodes.kubecloud.phennex.com" to be ready I0312 19:22:31.019373 15912 launchconfiguration.go:310] waiting for IAM instance profile "masters.kubecloud.phennex.com" to be ready I0312 19:22:41.459082 15912 executor.go:91] Tasks: 95 done / 112 total; 10 can run I0312 19:22:42.347766 15912 executor.go:91] Tasks: 105 done / 112 total; 7 can run I0312 19:22:42.413622 15912 natgateway.go:266] Waiting for NAT Gateway "nat-0ae48b59d01aac34f" to be available (this often takes about 5 minutes) I0312 19:22:42.413821 15912 natgateway.go:266] Waiting for NAT Gateway "nat-0b16ed2fe55e3b300" to be available (this often takes about 5 minutes) I0312 19:22:42.482413 15912 natgateway.go:266] Waiting for NAT Gateway "nat-0858a6417ddca6f17" to be available (this often takes about 5 minutes) I0312 19:24:43.871503 15912 executor.go:91] Tasks: 112 done / 112 total; 0 can run I0312 19:24:43.871556 15912 dns.go:141] Pre-creating DNS records I0312 19:24:45.673919 15912 update_cluster.go:208] Exporting kubecfg for cluster Kops has set your kubectl context to kubecloud.phennex.com Cluster is starting. It should be ready in a few minutes. Suggestions: * validate cluster: kops validate cluster * list nodes: kubectl get nodes --show-labels * ssh to the bastion: ssh -i ~/.ssh/id_rsa admin@bastion.kubecloud.phennex.com * read about installing addons: https://github.com/kubernetes/kops/blob/master/docs/addons.md
```

As you can see from the output, Kops will create all the needed resources at AWS including NAT Gateways for our private instances to be able to reach the public internet, the VPC, etc.

The creation of a cluster usally takes about 5–10 minutes.

As, also mentioned in the previous post, this will create all DNS entries in the private zone, thereby only making it accessible from within the AWS VPC. Therefore if you want to be able to connect to your cluster from your local machine, recreate the following entries in the public zone for your domain:

![](/blog-images/ha-kubernetes-cluster-on-aws-kops-makes-it-easy-02.png)

To verify that your cluster is up and running and reachable from your machine:

```bash
$ kubectl get nodes NAME STATUS AGE ip-172-20-110-125.eu-west-1.compute.internal Ready,master 2m ip-172-20-110-3.eu-west-1.compute.internal Ready 2m ip-172-20-53-117.eu-west-1.compute.internal Ready,master 3m ip-172-20-54-164.eu-west-1.compute.internal Ready 2m ip-172-20-65-18.eu-west-1.compute.internal Ready 2m ip-172-20-87-33.eu-west-1.compute.internal Ready,master 4m
```

Awesome, everything works as expected!

This is how easy it is to setup a highly available Kubernetes cluster on AWS using Kops! Kops just created all the network, the VPC, the NAT Gateway, the RouteTables for us!

*Originally published at* [kubecloud.io](http://kubecloud.io/kops-easy/) *on March 12, 2017.*

---

[HA Kubernetes Cluster on AWS? — Kops makes it easy](https://medium.com/kubecloud/ha-kubernetes-cluster-on-aws-kops-makes-it-easy-2337806d0311) was originally published in [kubecloud](https://medium.com/kubecloud) on Medium, where people are continuing the conversation by highlighting and responding to this story.
