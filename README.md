pages-ruby
==========

monome pages in ruby.  this is nowhere near usable.

setup instructions:

# install jruby 1.6.7 or later
# git clone https://github.com/dinchak/pages-ruby
# cd pages-ruby
# bundle install
# jruby --1.9 bin/runner.rb

to build a jar:

# gem install rawr
# cd lib/ruby
# ./unpack-gems
# cd ../..
# rake rawr:jar
