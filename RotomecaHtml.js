class RotomecaHtml {
    constructor(balise, parent, attribs = {}) {
        this.balise = balise;
        this.attribs = attribs;
        this.childs = [];
        this.parent = parent;
        this.link = null;
    }

    _update_class() {
        if (!this.attribs) this.attribs = {class:[]};
        else if (!this.attribs.class) this.attribs.class = [];
        else if (!!this.attribs.class && typeof this.attribs.class === 'string') this.attribs.class = this.attribs.class.split(' ');
        else if (!!this.attribs.class && !this.attribs.class instanceof Array) this.attribs.class = [this.attribs.class];

        return this;
    }

    addClass(class_to_add) {
        if (!this.hasClass(class_to_add)) this.attribs.class.push(class_to_add);
        return this;
    }

    hasClass(class_to_verify) {
        return this._update_class().attribs.class.includes(class_to_verify);
    }

    tag(balise, attribs = {}) {
        return this._create(balise, this, attribs, false);
    }

    div(attribs = {}) {
        return this.tag('div', attribs);
    }

    span(attribs = {}){
        return this.tag('span', attribs);
    }

    text(text) {
        return this._create(text, this, {is_raw:true}, true);
    }

    end(debug = null) {
        let end = this.parent._create(`/${this.balise}`, this.parent, null, true);

        if (!!debug) end.text(`<!-- ${debug} -->`);

        return end;
    }

    _create(balise, parent, attribs, isend) {
        this.childs.push(new RotomecaHtml(balise, parent, attribs));
         
        return isend ? parent : this.childs[this.childs.length - 1];
    }

    generate() {
        return this._generate({mode:1});
    }

    generate_html() {
        return this._generate({});
    }



    _generate({
        i = -1,
        mode = 0
    }) {
        let html = [];
        
        if ('start' !== this.balise) html.push(`${this._create_blanks(i)}${this._get_balise()}`);

        for (const iterator of this.childs) {
            html.push(iterator._generate({i:i + 1, mode}));
        }

        html = html.join('\r\n');

        switch (mode) {
            case 0:
                break;
            case 1:
                html = $(html);
                break ;
            default:
                throw new Error('mode not exist');
        }

        return html;
    }

    _get_balise(){
        let balise;

        if (true === this.attribs?.is_raw) balise = this.balise;
        else {
            balise = [`<${this.balise}`];

            if (typeof this.attribs === 'string') {
                if ('' !== this.attribs) balise.push(this.attribs);
            } 
            else if(!!this.attribs && Object.keys(this.attribs).length > 0) {
                for (const key in this.attribs) {
                    if (Object.hasOwnProperty.call(this.attribs, key)) {
                        const element = this.attribs[key];
                        
                        if (!key.includes('on') || (key.includes('on') && typeof element !== 'function')) {
                            
                            switch (key) {
                                case 'raw-content':
                                    break;

                                case 'class':
                                    if (element instanceof Array) {
                                        var current_class = [];

                                        for (const iterator of element) {
                                            if (typeof iterator === 'function') current_class.push(iterator(this));
                                            else current_class.push(iterator);
                                        }

                                        balise.push(`${key}="${current_class}"`);
                                        current_class.length = 0;
                                        current_class = null;
                                        break;
                                    }
                            
                                default:
                                    balise.push(`${key}="${(typeof element === 'function' ? element(this) : element)}"`);
                                    break;
                            }
                        }
                    }
                }
            }

            balise.push(`${(true === this.attribs?.one_line ? '/' : '')}>`);

            let join;
            if (balise.length === 2) join = '';      
            else join = ' ';

            if (!!this.attribs && !!this.attribs['raw-content']) balise.push((typeof this.attribs['raw-content'] === 'function' ? this.attribs['raw-content'](this) : this.attribs['raw-content']));

            balise = balise.join(join);
        }

        return balise;
    }

    _create_blanks(i){
        if (0 === i) return '';

        const tab = 4;
        let blanks = [];

        for (let index = 0, len = i*tab; index < len; ++index) {
            blanks.push(' ');            
        }

        return blanks.join('');
    }

    static start() {
        return new RotomecaHtml('start', null);
    }

    static create_alias(alias, {
        online = false,
        before_callback = null,
        callback = null,
        tag = 'div'
    }) {
        RotomecaHtml.prototype[alias] = function (attribs = {}, ...args) {
            if (!!before_callback) {
                const before = before_callback(attribs, ...args);

                if (!!before.attribs) attribs = before.attribs;
            }

            if (online && typeof attribs === 'object') attribs.one_line = true;

            let html = this._create(tag, this, typeof attribs === 'object' ? attribs : null, online);

            if (!!callback) {
                const call = callback(html, attribs, ...args);

                if (!!call && call instanceof RotomecaHtml) html = call;
            }

            return html;
        };

        return this;
    }
}
