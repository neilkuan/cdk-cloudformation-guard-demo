#!/bin/bash

function heading {
  printf "\e[38;5;81m$@\e[0m\n"
}

case $1 in
  bad)
    /Users/neilguan/lolbanner 'Demo K8S Bad'
    heading 'cfn-guard validate -r deployment.guard -d bad-deploy.yaml -o yaml'
    cfn-guard validate -r deployment.guard -d bad-deploy.yaml -o yaml
    ;;
  good)
    /Users/neilguan/lolbanner 'Demo K8S Good'
    heading 'cfn-guard validate -r deployment.guard -d good-deploy.yaml -o yaml'
    cfn-guard validate -r deployment.guard -d good-deploy.yaml -o yaml
    ;;
  *)
    heading 'Please Use check.sh [bad/good]'
    ;;
esac
exit 0