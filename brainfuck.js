(function ( window ) {
    // ===============================================================
    //      クラス継承用の関数。
    // ===============================================================
    function extend( parent, body ) {
        if ( parent ) {
            var F = function () {};
            F.prototype = parent.prototype;
            body.prototype = new F();
        }
        return body;
    }
    
    // ===============================================================
    //      Scanerクラス。
    // ===============================================================
    var Scaner = extend( null, function ( source ) {
        this.tokens = source.match( /([<>\+-\[\]\.\,])/g );
        this.index = 0;
    } );
    Scaner.prototype.peek = function () {
        if ( this.index < 0 || this.tokens.length <= this.index )
            return null;
        
        return this.tokens[ this.index ];
    };
    Scaner.prototype.next = function () {
        if ( this.index < this.tokens.length )
            this.index++;
    };
    Scaner.prototype.previous = function () {
        if ( -1 < this.index )
            this.index--;
    };
    
    // ===============================================================
    //      VirtualMachineクラス。
    // ===============================================================
    var VirtualMachine = extend( null, function ( scaner ) {
        this.scaner = scaner;
        
        this.memory = [];
        for ( var i = 0; i < 30000; i++ ) {
            this.memory[ i ] = 0;
        }
        this.index = 0;
        this.outputStream = [];
        this.inputStream = [];
    } );
    VirtualMachine.prototype.step = function () {
        var token = this.scaner.peek();
        if ( token == null )
            return false;
        
        var n = 0, counter = 0, s = '';
        switch ( token ) {
            case '<':
                this.index--;
                if ( this.index < 0 )
                    this.index = this.memory.length - 1;
                break;
            case '>':
                this.index++;
                if ( this.memory.length <= this.index )
                    this.index = 0;
                break;
            case '+':
                n = this.memory[ this.index ] + 1;
                if ( 255 < n )
                    n = 0;
                this.memory[ this.index ] = n;
                break;
            case '-':
                n = this.memory[ this.index ] - 1;
                if ( n < 0 )
                    n = 255;
                this.memory[ this.index ] = n;
                break;
            case '.':
                this.outputStream.push( this.memory[ this.index ] );
                break;
            case ',':
                if ( this.inputStream.length <= 0 && this.oninput ) {
                    s = this.oninput();
                    this.inputStream = [];
                    for ( var i = 0; i < s.length; i++ ) {
                        this.inputStream.push( s.charCodeAt( i ) );
                    }
                }
                
                if ( 0 < this.inputStream.length )
                    this.memory[ this.index ] = this.inputStream.shift();
                break;
            case '[':
                n = this.memory[ this.index ];
                if ( n === 0 ) {
                    counter = 1;
                    while ( true ) {
                        this.scaner.next();
                        if ( this.scaner.peek() === null )
                            return false;
                        
                        if ( this.scaner.peek() === '[' )
                            counter++;
                        else if ( this.scaner.peek() === ']' )
                            counter--;
                        
                        if ( counter === 0 )
                            return true;
                    }
                }
                break;
            case ']':
                n = this.memory[ this.index ];
                if ( n !== 0 ) {
                    counter = 1;
                    while ( true ) {
                        this.scaner.previous();
                        if ( this.scaner.peek() === null )
                            return false;
                        
                        if ( this.scaner.peek() === ']' )
                            counter++;
                        else if ( this.scaner.peek() === '[' )
                            counter--;
                        
                        if ( counter === 0 )
                            return true;
                    }
                }
                break;
        }
        
        this.scaner.next();
        return true;
    };
    VirtualMachine.prototype.run = function () {
        while ( this.step() )
            ;
            
        if ( this.onresult )
            this.onresult( this.outputStream );
    };
    
    // ===============================================================
    //      その他の処理。
    // ===============================================================
    window.Scaner = Scaner;
    window.VirtualMachine = VirtualMachine;
}( window ));