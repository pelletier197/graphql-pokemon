import{S as Q,i as P,s as w,a as u,w as d,ae as x,h as l,c,x as $,b as _,y as g,f as y,t as v,z as h}from"../../../../chunks/paths-9b8889ea.js";import{F as E,Q as F}from"../../../../chunks/FieldDetails-f2547bb3.js";import{P as S}from"../../../../chunks/PreviousNextPage-e58fc778.js";function b(r){let s,f,t,i,n,o;return document.title=s="Query - "+r[0].field.name,t=new E({props:{field:r[0].field,type:F.QUERY}}),n=new S({props:{page:r[0].page}}),{c(){f=u(),d(t.$$.fragment),i=u(),d(n.$$.fragment)},l(e){x("svelte-19yffit",document.head).forEach(l),f=c(e),$(t.$$.fragment,e),i=c(e),$(n.$$.fragment,e)},m(e,a){_(e,f,a),g(t,e,a),_(e,i,a),g(n,e,a),o=!0},p(e,[a]){(!o||a&1)&&s!==(s="Query - "+e[0].field.name)&&(document.title=s);const m={};a&1&&(m.field=e[0].field),t.$set(m);const p={};a&1&&(p.page=e[0].page),n.$set(p)},i(e){o||(y(t.$$.fragment,e),y(n.$$.fragment,e),o=!0)},o(e){v(t.$$.fragment,e),v(n.$$.fragment,e),o=!1},d(e){e&&l(f),h(t,e),e&&l(i),h(n,e)}}}function q(r,s,f){let{data:t}=s;return r.$$set=i=>{"data"in i&&f(0,t=i.data)},[t]}class N extends Q{constructor(s){super(),P(this,s,q,b,w,{data:0})}}export{N as default};
