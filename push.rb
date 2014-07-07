#! /usr/bin/env ruby

require 'json'
require 'algoliasearch'

if ARGV.length != 3
  $stderr << "usage: push.rb APPLICATION_ID API_KEY INDEX\n"
  exit 1
end

products = JSON.parse File.read(File.join(__FILE__, '..', 'data.json'))

Algolia.init :application_id => ARGV[0], :api_key => ARGV[1]

index = Algolia::Index.new(ARGV[2])
index.clear_index! rescue 'not fatal'
index.add_objects products
