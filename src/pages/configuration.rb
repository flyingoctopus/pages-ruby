require_relative 'serialosc'
require_relative 'midi_manager'

module MonomePages
  class Configuration

    attr_reader :serialosc, :midi

    def initialize
      @serialosc = MonomePages::SerialOSC.new
      @midi = MonomePages::MIDIManager.new
    end
  end
end