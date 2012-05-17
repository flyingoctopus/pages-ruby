require 'dnssd'
require 'ap'
require_relative 'serialosc_device'

module MonomePages
  class SerialOSC

    attr_reader :services, :devices

    def initialize
      @services = {}
      @devices = {}
    end

    def detect
      @browseThread = Thread.start do
        DNSSD.browse! '_monome-osc._udp', 'local' do |reply|
          DNSSD.resolve reply do |service|
            next if @services.has_key? service.name
            @services[service.name] = service
            device = MonomePages::SerialOSCDevice.new service
            device.start_osc_server
            device.init_device
            sleep 0.1
            @devices[device.id] = device
          end
        end
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

  end
end
