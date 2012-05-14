module MonomePages
  class Page
    attr_reader :name, :code

    def initialize(name)
      @name = name
      @code = "code"
    end

    def to_json(*a)
      {
        :name => @name,
        :code => @code
      }.to_json(*a)
    end
      
  end
end