#!/bin/bash -xe

HELM_VERSION=3.2.4

# Faster than VirtualBox's DNS Server
sed -i 's/127.0.0.53/1.1.1.1/' /etc/resolv.conf

wget https://get.helm.sh/helm-v$HELM_VERSION-linux-amd64.tar.gz
tar -xzf helm-v$HELM_VERSION-linux-amd64.tar.gz
mv linux-amd64/helm /usr/local/bin/helm
rm -rf helm-v$HELM_VERSION-linux-amd64.tar.gz linux-amd64

swapoff -a
sed -i '/swap/d' /etc/fstab

snap install microk8s --classic --channel=1.19/stable

# Waits until K8s cluster is up
sleep 15

microk8s.enable dns
microk8s.enable metallb:192.168.50.100-192.168.50.200
microk8s.enable ingress
microk8s.enable storage
microk8s.enable prometheus
microk8s.enable metrics-server
microk8s.enable istio

mkdir -p /home/vagrant/.kube
microk8s config > /home/vagrant/.kube/config
usermod -a -G microk8s vagrant
chown -f -R vagrant /home/vagrant/.kube

curl https://get.docker.com | sh -
usermod -aG docker vagrant