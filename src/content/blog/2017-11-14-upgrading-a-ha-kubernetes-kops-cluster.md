---
title: "Upgrading a HA Kubernetes Kops Cluster"
date: 2017-11-14
summary: "The Kubernetes release cadence is fast-paced with minor releases every quarter. Awesome! But how do I keep up?"
tags: ["cloud-native", "kops", "kubernetes"]
hero: "upgrading-a-ha-kubernetes-kops-cluster-01.jpeg"
canonical: "https://medium.com/kubecloud/upgrading-a-ha-kubernetes-kops-cluster-9fb34c441333"
source: medium
---
The Kubernetes release cadence is fast-paced with minor releases every quarter. Awesome! But how do I keep up?

Don’t worry, Kops makes it fairly easy to update your HA production cluster without any downtime (assuming you have scaled your deployments to a minimum of 2 pods per deployment).

This blog post will walk you through upgrading your Kubernetes cluster version 1.6.2 cluster to Kubernetes cluster 1.7.10. The following will (most-likely) be applicable with other versions as well. Before any production upgrade, some testing and walkthrough of the gameplan is always a good idea. We currently have three Kubernets clusters managed by Kops on AWS; dev, staging, and production. However, all environments are actively being used on a daily basis. Shutting down a cluster a day or two for testing is really not an option. Instead, Kops makes it incredibly easy to test your upgrade process by making it easy to spin up new clusters with specific configurations.

In the following section I will provide you with a hands-on description of how you can upgrade you cluster without any downtime.

Enough with the introduction, let’s get down to business!

Go to the Kops git-repo and download Kops version 1.6.2, or just click on this link: [https://github.com/kubernetes/kops/releases/tag/1.6.2](https://github.com/kubernetes/kops/releases/tag/1.6.2)

If you haven’t set up a Kubernetes Kops cluster before, I will advise you to go have a look at some of my previous posts about this subject. (Links: [HA Kubernetes Cluster on AWS? — Kops makes it easy](https://kubecloud.io/ha-kubernetes-cluster-on-aws-kops-makes-it-easy-2337806d0311) and [Setting up a Highly Available Kubernetes Cluster with private networking on AWS using Kops](https://kubecloud.io/setting-up-a-highly-available-kubernetes-cluster-with-private-networking-on-aws-using-kops-65f7a94782ef))

In the following I assume that you have setup all the prerequisites for spinning up a Kops cluster, such as an S3 bucket, Route53, etc.

Let’s get started.

Set up your environment variables for the Kops, and configure you AWS profile (I’m using multiple AWS configs) as follows:

```
export KOPS_STATE_STORE=”s3://path_to_your_bucket”
export KOPS_NAME=name_of_your_new_cluster
export PRIVATE_HOSTED_ZONE_ID=id_of_your_route53_private_zone
export AWS_PROFILE=your_aws_profile
```

Spin up a new cluster with Kops 1.6.2 installed using the following configuration

```
kops create cluster \
  --name $KOPS_NAME \
  --state $KOPS_STATE_STORE \
  --node-count 3 \
  --zones eu-west-1a,eu-west-1b,eu-west-1c \
  --master-zones eu-west-1a,eu-west-1b,eu-west-1c \
  --dns-zone=${PRIVATE_HOSTED_ZONE_ID} \
  --dns private \
  --node-size t2.medium \
  --master-size t2.small \
  --topology private \
  --networking weave \
  --image kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 \
  --kubernetes-version=1.6.2 \
  --yes
```

This will spin up a HA kubernetes cluster with three master nodes spread across three availability zones, and three worker nodes, also spread across three availability zones. Wait for the cluster to spin up and verify that you can get a list of nodes (the above will spin up a private cluster and you therefore need to add a public DNS entry in Route53 to access the Kubernetes api from the internet. Just duplicate the entry Kops created in the private zone in the public zone):

```bash
$ kubectl get nodes -L kubernetes.io/role
NAME                                           STATUS    AGE       VERSION   ROLE
ip-172-20-126-152.eu-west-1.compute.internal   Ready     1m        v1.6.2    master
ip-172-20-127-107.eu-west-1.compute.internal   Ready     36s       v1.6.2    node
ip-172-20-55-11.eu-west-1.compute.internal     Ready     1m        v1.6.2    master
ip-172-20-63-108.eu-west-1.compute.internal    Ready     20s       v1.6.2    node
ip-172-20-69-180.eu-west-1.compute.internal    Ready     22s       v1.6.2    node
ip-172-20-89-92.eu-west-1.compute.internal     Ready     2m        v1.6.2    master
```

Verify the kubernetes version with

```bash
$ kubectl version
Client Version: version.Info{Major:"1", Minor:"7", GitVersion:"v1.7.4", GitCommit:"793658f2d7ca7f064d2bdf606519f9fe1229c381", GitTreeState:"clean", BuildDate:"2017-08-17T08:48:23Z", GoVersion:"go1.8.3", Compiler:"gc", Platform:"darwin/amd64"}
Server Version: version.Info{Major:"1", Minor:"6", GitVersion:"v1.6.2", GitCommit:"477efc3cbe6a7effca06bd1452fa356e2201e1ee", GitTreeState:"clean", BuildDate:"2017-04-19T20:22:08Z", GoVersion:"go1.7.5", Compiler:"gc", Platform:"linux/amd64"}
```

## Upgrading your cluster configuration

We are now ready to update our cluster. Kops comes with a simple feature for upgrading your cluster with the upgrade command.

Before we run the update command we need to go fetch the latest version of Kops (in the time of writing 1.7.1, link: [https://github.com/kubernetes/kops/releases/tag/1.7.1](https://github.com/kubernetes/kops/releases/tag/1.7.1))

Now run the upgrade command as follows:

```bash
$ kops upgrade cluster $KOPS_NAME
ITEM    PROPERTY  OLD       NEW
Cluster    KubernetesVersion 1.6.2       1.7.10
InstanceGroup/master-eu-west-1a Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
InstanceGroup/master-eu-west-1b Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
InstanceGroup/master-eu-west-1c Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
InstanceGroup/nodes  Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
```

```
Must specify --yes to perform upgrade
```

Verify the options that Kops provides, and if satisfied, add --yes to the command for upgrading the cluster configuration.

```bash
$ kops upgrade cluster $KOPS_NAME --yes
ITEM    PROPERTY  OLD       NEW
Cluster    KubernetesVersion 1.6.2       1.7.10
InstanceGroup/master-eu-west-1a Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
InstanceGroup/master-eu-west-1b Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
InstanceGroup/master-eu-west-1c Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
InstanceGroup/nodes  Image   kope.io/k8s-1.6-debian-jessie-amd64-hvm-ebs-2017-05-02 kope.io/k8s-1.7-debian-jessie-amd64-hvm-ebs-2017-07-28
```

```
Updates applied to configuration.
You can now apply these changes, using `kops update cluster $KOPS_NAME`
```

Next, thing is to push this new configuration to AWS, with the update command.

```bash
$ kops update cluster $KOPS_NAME 
... a lot of output ...
```

Verify the changes that Kops will make in AWS and when satisfied, accept by appending the --yes flag to the above command.

```bash
$ kops update cluster $KOPS_NAME --yes
I1112 14:00:00.516806    4406 dns.go:91] Private DNS: skipping DNS validation
I1112 14:00:01.500941    4406 executor.go:91] Tasks: 0 done / 103 total; 39 can run
I1112 14:00:02.470532    4406 executor.go:91] Tasks: 39 done / 103 total; 20 can run
I1112 14:00:03.252511    4406 executor.go:91] Tasks: 59 done / 103 total; 30 can run
I1112 14:00:05.935267    4406 executor.go:91] Tasks: 89 done / 103 total; 8 can run
I1112 14:00:06.095672    4406 dnsname.go:110] AliasTarget for "..." is "....."
I1112 14:00:06.481874    4406 executor.go:91] Tasks: 97 done / 103 total; 6 can run
I1112 14:00:07.024391    4406 executor.go:91] Tasks: 103 done / 103 total; 0 can run
I1112 14:00:07.024442    4406 dns.go:152] Pre-creating DNS records
I1112 14:00:07.581470    4406 update_cluster.go:247] Exporting kubecfg for cluster
Kops has set your kubectl context to $KOPS_NAME
```

```
Cluster changes have been applied to the cloud.
```

```
Changes may require instances to restart: kops rolling-update cluster
```

## Rolling update your cluster

Kops provides a couple of different options for rolling updating your cluster. The default behavior will stop your instance one by one with a default timeout until all nodes has been restarted and updated. Kops also provides a more safe rolling-update with the feature flag +DrainAndValidateRollingUpdate. This flag will first cordon the node, which will disable scheduling on the node. When this is done, Kops will drain the node which will give all pods running on the node a gracefully shutdown and rescheduling.

```
export KOPS_FEATURE_FLAGS=”+DrainAndValidateRollingUpdate”
```

This is a great feature, however it could potentially cause downtime while updating your cluster. Kops will shutdown a node before spinning up a new one. Depending on your resource capacity this may be an issue. If that’s the case, consider scaling the cluster before a production upgrade.

Another problem with this approach is draining the code, which will shutdown all pods on the instance, potentially resulting in bottlenecks on the nodes where pods will be rescheduled because of image download time. Further there’s no priority of which pods while be restarted first, meaning kube-system pods, such as kube-dns may be the last pod to get downloaded and restarted.

Instead of using these approaches, I’ve been doing it in a more manual fashion to insure no downtime during production upgrades.

To continue our previous example, let’s start out by performing a rolling-updating on our master nodes, one by one.

```bash
$ kops rolling-update cluster $KOPS_NAME --instance-group master-eu-west-1a --yes
```

```bash
$ kops rolling-update cluster $KOPS_NAME --instance-group master-eu-west-1b --yes
```

```bash
$ kops rolling-update cluster $KOPS_NAME --instance-group master-eu-west-1c --yes
```

You should be able to combine this to one command. However, I like to verify that everything is running before continuing.

```bash
$ kubectl get nodes -L kubernetes.io/role
NAME                                           STATUS    AGE       VERSION   ROLE
ip-172-20-115-44.eu-west-1.compute.internal    Ready     1m        v1.7.10   master
ip-172-20-127-107.eu-west-1.compute.internal   Ready     29m       v1.6.2    node
ip-172-20-41-196.eu-west-1.compute.internal    Ready     19m       v1.7.10   master
ip-172-20-63-108.eu-west-1.compute.internal    Ready     28m       v1.6.2    node
ip-172-20-69-180.eu-west-1.compute.internal    Ready     29m       v1.6.2    node
ip-172-20-89-246.eu-west-1.compute.internal    Ready     6m        v1.7.10   master
```

Next, we are going to rolling update our nodes one by one.

We start out by making the node unschedulable:

```bash
$ kubectl cordon <NODE>
```

Now, one by one, delete pods and wait for them to reschedule on another node.

```bash
$ kubectl delete pod <POD>
```

You can use the following command to list all pods running on the particular node

```bash
$ kubectl get pods --all-namespaces -owide | grep <NODE>
```

When all pods are moved and restartet, drain the node:

```bash
$ kubectl drain --force --ignore-daemonsets <NODE>
```

Last thing, go to the AWS EC2 console and terminate the node.

Repeat these steps for all worker nodes.

When all worker nodes has been rolling updated, the cluster upgrade is finished, and you should see all nodes running Kubernetes 1.7.10.

```bash
$ kubectl get nodes -L kubernetes.io/role
NAME                                           STATUS    AGE       VERSION   ROLE
ip-172-20-115-44.eu-west-1.compute.internal    Ready     10m       v1.7.10   master
ip-172-20-117-194.eu-west-1.compute.internal   Ready     1m        v1.7.10   node
ip-172-20-41-196.eu-west-1.compute.internal    Ready     28m       v1.7.10   master
ip-172-20-42-10.eu-west-1.compute.internal     Ready     5m        v1.7.10   node
ip-172-20-67-240.eu-west-1.compute.internal    Ready     3m        v1.7.10   node
ip-172-20-89-246.eu-west-1.compute.internal    Ready     15m       v1.7.10   master
```

When finished trying the upgrade procedure, you can easily delete all resources created by Kops:

```bash
$ kops delete cluster $KOPS_NAME --yes
```

That’s it. Happy upgrading your Kops clusters.

---

[Upgrading a HA Kubernetes Kops Cluster](https://medium.com/kubecloud/upgrading-a-ha-kubernetes-kops-cluster-9fb34c441333) was originally published in [kubecloud](https://medium.com/kubecloud) on Medium, where people are continuing the conversation by highlighting and responding to this story.
