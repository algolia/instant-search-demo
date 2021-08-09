#!/usr/bin/env bash

set -e

kubectl config unset clusters.microk8s-cluster
kubectl config unset contexts.microk8s
kubectl config unset users.admin

rm -f ./deploy/terraform/terraform.tfstate
rm -f ./deploy/terraform/terraform.tfstate.backup
rm -f ./deploy/terraform/.terraform.lock.hcl
