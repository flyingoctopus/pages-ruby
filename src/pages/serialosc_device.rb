require 'osc-ruby'
require_relative 'page'

module MonomePages
  class SerialOSCDevice
    attr_reader :service, :name, :send_port, :listen_port, :domain, :connected, :type, :size_x, :size_y, :encoders, :pages, :serial
    attr_accessor :id

    def initialize(service)
      @service = service
      @name = @service.getName
      # the port serialosc listens on and we send to
      @send_port = @service.getPort
      @domain = @service.getDomain
      @serial = ''
      @encoders = 0
      @size_x = 0
      @size_y = 0
      @prefix = '/monome'
      @connected = true
      @pages = []

      # best way i can come up with to detect arc
      if @name =~ /arc (\d)/
        @type = :arc
        @encoders = $1.to_i
        puts @name + ": #{@encoders} encoder arc" if $PAGES_DEBUG
      end

    end

    def start_osc_server
      foundPort = false
      while !foundPort do
        # rescue in case port is in use
        begin
          # the port we listen on and serialosc sends to
          @listen_port = rand(1024..65535)
          @server = OSC::Server.new(@listen_port)
          foundPort = true
        rescue
        end
      end

      if $PAGES_DEBUG
        @server.add_method /.*/ do |msg|
          puts @name + ": " + msg.address + " " + msg.to_a.to_s
        end
      end

      @server.add_method "/sys/size" do |msg|
        args = msg.to_a
        if args[0] > 0 and args[1] > 0
          @type = :grid
          @size_x = args.shift
          @size_y = args.shift
          puts @name + ": #{@size_x.to_s}x#{@size_y.to_s} grid" if $PAGES_DEBUG
        end
      end

      @server.add_method "/sys/id" do |msg|
        @serial = msg.to_a.shift
      end

      @server.add_method "/sys/rotation" do |msg|
        @rotation = msg.to_a.shift
      end

      @server.add_method "/sys/disconnect" do |msg|
        @connected = false
      end

      @server.add_method "/sys/connect" do |msg|
        @connected = true
      end

      @server.add_method "#{@prefix}/grid/key" do |msg|
        self.grid_key(msg.to_a) if self.respond_to?('grid_key')
      end

      @serverThread = Thread.start do
        @server.run
      end
    end

    def init_device
      begin
        @client = OSC::Client.new 'localhost', @send_port
        @client.send OSC::Message.new('/sys/port', @listen_port)
        @client.send OSC::Message.new('/sys/prefix', @prefix)
        @client.send OSC::Message.new('/sys/info')
      rescue
      end
    end

    def to_json(*a)
      {
        :id => @id,
        :name => @name,
        :type => @type,
        :domain => @domain,
        :listen_port => @listen_port,
        :send_port => @send_port,
        :connected => @connected,
        :encoders => @encoders,
        :size_x => @size_x,
        :size_y => @size_y,
        :pages => @pages
      }.to_json(*a)
    end

    def add_page(name)
      page = Page.new name
      page.id = pages.length
      pages.push page
    end

  end
end
