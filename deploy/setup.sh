#!/usr/bin/env bash

set -ex

# Setup Specific CAROOT for the local env in microk8s
export CAROOT=./deploy/tmp
mkcert --install

# SSH Configuration
SSH_IP=192.168.50.4
SSH_USER=vagrant
SSH_PASS=vagrant
SSH_STR=${SSH_USER}@${SSH_IP}

# remove entry in knowhost list for re-use
ssh-keygen -R ${SSH_IP}

# Add SSH for cert-auth
ssh-add ~/.ssh/id_rsa
sshpass -p "${SSH_PASS}" ssh-copy-id -o StrictHostKeyChecking=no ${SSH_STR}

# Extract kube_config
ssh ${SSH_STR} "microk8s config >> kube_config"
scp ${SSH_STR}:~/kube_config ./deploy/tmp/kube_config
ssh ${SSH_STR} "rm kube_config"

# Fix IP in kube_config
sed "s/10.0.2.15/${SSH_IP}/" ./deploy/tmp/kube_config >> ./deploy/tmp/kube_config_fix
rm ./deploy/tmp/kube_config
mv ./deploy/tmp/kube_config_fix ./deploy/tmp/kube_config

# Import kube_config to client
kubectl konfig import -s ./deploy/tmp/kube_config
rm ./deploy/tmp/kube_config
