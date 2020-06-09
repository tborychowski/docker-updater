#!/bin/bash

shopt -s nullglob
DIR="$(pwd)"

ln -sf $DIR/index.js $HOME/bin/docker updater
