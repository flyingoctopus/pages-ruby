$PAGES_DEBUG=1
module MonomePages
  VERSION = '0.0.1'
end

require_relative 'pages/configuration'
require_relative 'pages/web_server'

config = MonomePages::Configuration.new
config.serialosc.detect

at_exit do
  ap "JmDNS: closing..." if $PAGES_DEBUG
  config.serialosc.jmdns.close
end
webserver = MonomePages::WebServer.new config.serialosc, config.midi