module MonomePages
  VERSION = '0.0.1'
end

require 'serialosc'
require 'midi_manager'
require 'web_server'

module MonomePages
  class Configuration

    attr_reader :serialosc, :midi

    def initialize
      @serialosc = MonomePages::SerialOSC.new
      @midi = MonomePages::MIDIManager.new
      @webserver = MonomePages::WebServer.new @serialosc, @midi     
    end

  end
end