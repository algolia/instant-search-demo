data "template_file" "argocd_system" {
  template = file("./template/argocd_values.tmpl")
  vars = { 
      argoPass = var.argo_pass
   }
}

resource "helm_release" "argocd_system" {
  depends_on = []
  name       = "argo-cd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "3.11.1"
  timeout    = 3000

  create_namespace = true
  namespace = "argocd-system"

  values = [
      data.template_file.argocd_system.rendered
  ]

}