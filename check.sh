#!/bin/bash
/Users/neilguan/lolbanner 'Demo Cloudformation'

function heading {
  printf "\e[38;5;81m$@\e[0m\n"
}

function error {
  printf "\e[91;5;81m$@\e[0m\n"
}

function success {
  printf "\e[32;5;81m$@\e[0m\n"
}

function reset {
  rm -f "${statedir}/.foreach."*
  success "state cleared. you are free to start a new command."
}

heading 'for i in `ls cdk.out/*template.json`;do cfn-guard validate  -r sg-rule-common-tcp.rules -o yaml --data $i;done'

yarn guardcheck
