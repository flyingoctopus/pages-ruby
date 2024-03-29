require 'java'
require 'ap'
require_relative 'serialosc_device'
require 'lib/java/jmdns.jar'

module MonomePages
  class SerialOSC

    attr_reader :services, :devices, :jmdns

    def initialize
      @services = []
      @devices = []
    end

    def detect
      ap "JmDNS: detecting..." if $PAGES_DEBUG
      @jmdns = javax.jmdns.JmDNS.create()
      services = @jmdns.list('_monome-osc._udp.local.') if $PAGES_DEBUG
      services.each do |service|
        ap "JmDNS: service #{service.getName} discovered" if $PAGES_DEBUG
        next if @services.index {|s| s.getName == service.getName } != nil
        @services.push service
        device = MonomePages::SerialOSCDevice.new service
        device.start_osc_server
        device.init_device
        ap "JmDNS: discovered name:#{device.name}" if $PAGES_DEBUG
        device.id = @devices.length
        @devices.push device
      end
    end

    def register(name, port)
      DNSSD.register! name, '_monome-osc._udp', 'local', port
      ap "DNSSD: registering #{name} on port #{port}" if $PAGES_DEBUG
    end

    def to_json(*a)
      {
        :devices => @devices
      }.to_json(*a)
    end

    def find(&b)
      index = @devices.index &b
      return nil if index == nil
      return @devices[index]
    end

  end
end
