#!/bin/bash

# check if node is installed
if ! [ -x "$(command -v node)" ]; then
  echo 'Error: node is not installed.' >&2
  echo 'Download at https://nodejs.org/'
  exit 1
fi

# accept username and password
while [ -z "$username" ]; do
  read -p "Username: " username
done

while [ -z "$password" ]; do
  read -s -p "Password: " password
  echo
done

# accept login type
while [ -z "$loginType" ]; do
  read -p "Login type (i=instagram, f=facebook): " loginType
done

# accept etc.
while [ -z "$gui" ]; do
  read -p "GUI?(y/n): " gui
done

# install dependencies
npm ci

# start bot
export USER_ID=$username
export PASSWORD=$password

if [ $loginType == "i" ]; then
  export LOGIN_PROVIDER="instagram"
elif [ $loginType == "f" ]; then
  export LOGIN_PROVIDER="facebook"
else
  echo "Invalid login type $loginType"
  exit 1
fi

[[ $gui == "y" ]] && gui="true" || gui="false"

node index.js $gui