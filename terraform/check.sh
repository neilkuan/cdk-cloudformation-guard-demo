#!/bin/bash

function heading {
  printf "\e[38;5;81m$@\e[0m\n"
}

case $1 in
  bad)
    /Users/neilguan/lolbanner 'Demo Bad Instance'
    cd bad_instance
    terraform plan -out tfbad.bin 2>&1 1>/dev/null
    terraform show -json tfbad.bin > tfbad.json
    cd ..
    heading 'cfn-guard validate -r terraform.guard -d bad_instance/tfbad.json -o yaml'
    cfn-guard validate -r terraform.guard -d bad_instance/tfbad.json -o yaml
    ;;
  good)
    /Users/neilguan/lolbanner 'Demo Good Instance'
    cd good_instance
    terraform plan -out tfgood.bin 2>&1 1>/dev/null
    terraform show -json tfgood.bin > tfgood.json
    cd ..
    heading 'cfn-guard validate -r terraform.guard -d good_instance/tfgood.json -o yaml'
    cfn-guard validate -r terraform.guard -d good_instance/tfgood.json -o yaml
    ;;
  *)
    heading 'Please Use check.sh [bad/good]'
    ;;
esac
exit 0