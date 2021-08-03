#!/usr/bin/env bash

kubectl config unset clusters.microk8s-cluster
kubectl config unset contexts.microk8s
kubectl config unset users.admin
