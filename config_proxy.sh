#!/bin/bash

# (C) Copyright 2015, Siemens AG
# Author: Marcos J. S. Rocha
#
# SPDX-License-Identifier:     BSD-2-Clause

echo "__________________________________"
echo "    Proxy Config Tool v0.9.2"
echo "__________________________________"

######### DEFAULT VALUES #########
export DEFAULT_HTTP_PROXY="http://127.0.0.1:3128"
export MY_FILENAME=$0
if [[ $MY_FILENAME == "bash" ]]; then
  # script sourced (e.g. executed as ". config_proxy.sh")
  export MY_FILENAME=". config_proxy.sh"
fi


if [[ -z $1 ]]; then
  export MY_HTTP_PROXY=$DEFAULT_HTTP_PROXY
else
  export MY_HTTP_PROXY="$1"
fi
# case insensitive comparison
shopt -s nocasematch
if [[ $MY_HTTP_PROXY == "NoProxy" ]]; then
  export NO_PROXY=1
else
  export NO_PROXY=0
fi

if [[ $NO_PROXY == 0 ]]; then
  # Extract PROXY_HOST and PROXY_PORT from e.g. http://127.0.0.1:3128
  export PROXY_HOST_PORT=`echo $MY_HTTP_PROXY | sed -e's@http://@@g'`
  export PROXY_HOST=`echo $PROXY_HOST_PORT | cut -d: -f1`
  export PROXY_PORT=`echo $PROXY_HOST_PORT | cut -d: -f2`
fi


echo "###"
echo "Configuring HTTP(S)_PROXY=$MY_HTTP_PROXY (NoProxy=$NO_PROXY)"
echo "Usage: "
echo "   $MY_FILENAME [HTTP_PROXY]: config default or specified proxy (default: $DEFAULT_HTTP_PROXY), e.g.:"
echo "     $MY_FILENAME"
echo "     $MY_FILENAME http://127.0.0.1:3128"
echo "     $MY_FILENAME http://127.0.0.1:8888"
echo "     $MY_FILENAME NoProxy"
echo "###"

echo "# Setting environment variables..."
if [[ $NO_PROXY == 0 ]]; then
  export http_proxy=$MY_HTTP_PROXY
  export https_proxy=$MY_HTTPS_PROXY
  export PROXY=$MY_HTTP_PROXY
  export GRADLE_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT"
else
  export http_proxy=""
  export https_proxy=""
  export PROXY=""
  export GRADLE_OPTS=""
fi
echo "Environment Variables Result:"
echo "http_proxy=$http_proxy"
echo "https_proxy=$https_proxy"
echo "PROXY=$PROXY"
echo "GRADLE_OPTS=$GRADLE_OPTS"

echo "# Configuring GIT proxy..."
if [[ $NO_PROXY == 0 ]]; then
  git config --global http.proxy $MY_HTTP_PROXY
  git config --global https.proxy $MY_HTTPS_PROXY
  git config --global url."http://".insteadOf git://
  git config --global http.sslVerify false
else
  git config --global --unset-all http.proxy
  git config --global --unset-all https.proxy
  git config --global url."http://".insteadOf git://
  git config --global http.sslVerify true
fi
echo GIT Config Result:
git config --global -l

echo "# Configuring NPM proxy, NPM registry and certificate check..."
if [[ $NO_PROXY == 0 ]]; then
  npm config set proxy $MY_HTTP_PROXY
  npm config set https-proxy $MY_HTTPS_PROXY
  npm config set strict-ssl false
  npm config set registry http://registry.npmjs.org/
else
  npm config delete proxy 
  npm config delete https-proxy 
  npm config set strict-ssl true
  npm config set registry https://registry.npmjs.org/
fi
echo "NPM Config Result:"
npm config list



echo "**********************************************************"
echo "***** Manual tasks:"
echo "***** 1) Consider setting bower proxy settings manually by editing the file .bowerrc "
echo "**********************************************************"

echo "**********************************************************"
echo "***** If errors persist, consider:"
echo "*****   1) Removing node_modules directory and "
echo "*****   2) Cleaning npm cache by executing: npm cache clean"
echo "**********************************************************"

