#!/bin/bash

# Create and configure the Drupal files directories.
DRUPAL_BASIC_SETUP_FILE=/etc/doj_basic_setup_complete

# Check to see if we've already performed this setup.
if [ ! -e "$DRUPAL_BASIC_SETUP_FILE" ]; then

  # Clone our repos.
  cd /var/www
  sudo chmod 777 .
  git clone https://github.com/usdoj/foia-api.git
  git clone https://github.com/usdoj/foia.gov.git
  # Rename the API repo to match the way it is used in various files: dojfoia.
  mv foia-api dojfoia

  # Back-stage installation.
  cd /var/www/dojfoia
  composer install
  cp docroot/sites/default/settings/default.local.settings.php docroot/sites/default/settings/local.settings.php
  cp -r simplesamlphp/* vendor/simplesamlphp/simplesamlphp/
  cat /dev/urandom | tr -cd 'a-f0-9' | head -c 32 > salt.txt

  # Front-stage installation.
  # Includes a manual Ruby installation because I can't get DrupalVM to set
  # a specific version of Ruby.
  gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB
  \curl -sSL https://get.rvm.io | bash -s stable
  source /home/vagrant/.rvm/scripts/rvm
  rvm install "ruby-2.3.4"
  cd /var/www/foia.gov
  gem install bundler
  bundle install
  npm install
  NODE_ENV=local APP_ENV=local make build

  # Create a file to indicate this script has already run.
  sudo touch $DRUPAL_BASIC_SETUP_FILE
else
  exit 0
fi
