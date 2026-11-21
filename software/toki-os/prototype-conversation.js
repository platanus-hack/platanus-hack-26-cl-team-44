// Local conversation vocabulary from Emmy’s original prototype.
const EMOS = [
  {id:'ironica',e:'😏',n:'irónica',  rate:.95,pitch:1.05,vol:1},
  {id:'alegre', e:'😄',n:'alegre',   rate:1.08,pitch:1.2,vol:1},
  {id:'carinosa',e:'🥰',n:'cariñosa',rate:.9, pitch:1.12,vol:.95},
  {id:'susurro',e:'🤫',n:'susurro',  rate:.88,pitch:1,  vol:.45},
  {id:'seria',  e:'😐',n:'seria',    rate:.95,pitch:.9, vol:1},
  {id:'entusiasta',e:'🤩',n:'entusiasta',rate:1.18,pitch:1.3,vol:1}];
const EMO = Object.fromEntries(EMOS.map(e=>[e.id,e]));
const RULES = [
  {k:/cena|comer|almuerz|domingo|once/i, s:[
    ['¡Obvio! Guárdame del postre de la abuela.','cariñosa','carinosa'],
    ['Sí, llego a las 8.','breve','seria'],
    ['Si cocina tu papá, lo pienso.','con humor','ironica'],
    ['Este domingo no puedo, ¿el próximo?','neutra','seria']]},
  {k:/c[oó]mo est[aá]s|c[oó]mo te sientes|qu[eé] tal/i, s:[
    ['Bien, con ganas de verte.','cariñosa','carinosa'],
    ['Cansada, pero contenta de que vinieras.','honesta','seria'],
    ['Mejor que tu equipo de fútbol.','con humor','ironica'],
    ['Un poco adolorida hoy.','breve','seria']]},
  {k:/duele|dolor|molest/i, s:[
    ['Sí, me duele la espalda.','directa','seria'],
    ['Un poco, ¿me cambias de posición?','pedido','seria'],
    ['No, estoy bien, tranquila.','calma','carinosa'],
    ['Me duele la cabeza, ¿me das algo?','pedido','seria']]},
  {k:/fr[ií]o|calor|tapo|ventana/i, s:[
    ['Tengo frío, ¿me tapas?','pedido','carinosa'],
    ['Abre la ventana, porfa.','pedido','seria'],
    ['Estoy perfecta así.','breve','alegre'],
    ['Hace un calor de infierno.','con humor','ironica']]},
  {k:/agua|sed|tomar|caf[eé]/i, s:[
    ['Sí, agua por favor.','breve','seria'],
    ['Un café, si hay.','pedido','alegre'],
    ['No, gracias.','breve','seria'],
    ['Una cerveza, pero no le digas al doctor.','con humor','ironica']]}];
const DEFAULT = [
  ['Sí, claro.','breve','seria'],
  ['Cuéntame más.','interés','alegre'],
  ['Dame un segundo, lo estoy pensando.','pausa','seria'],
  ['Jajaja, no puedo contigo.','con humor','alegre']];
const REACTS = [
  ['😂','jajaja','alegre'],['😱','¡no!','entusiasta'],['🤔','mmm…','seria'],['❤️','te quiero','carinosa'],
  ['🙄','¿en serio?','ironica'],['✋','espera','seria'],['😋','¡qué rico!','alegre'],['👍','dale','alegre']];
const GROUPS = ['ABCDE','FGHIJ','KLMNÑ','OPQRS','TUVWXYZ'];
const WORDS = ('que de no a la el es y en lo un por me una te los se con para mi está si pero las bien sí más ya muy hola gracias quiero puedo hoy mañana domingo cena casa ahora después tengo frío calor agua dolor espalda cabeza posición ayuda cansada contenta mamá hija hijo nieto sofía camila amor también nunca siempre llámame ven espera favor porfa listo bueno vale dale claro obvio todo nada algo mucho poco feliz triste rico tele música película dormir comer baño luz ventana').split(' ');

const conversation = {
  context: '¿Vienes a cenar el domingo?',
  tab: 'respuestas',
  tones: {},
  group: '',
  selectedText: '',
  selectedTone: 'seria'
};

function predictions(text) {
  const prefix = text.toLocaleLowerCase('es').match(/[^\s]+$/u)?.[0];
  if (!prefix) return [];
  let learned = {};
  try {
    learned = JSON.parse(localStorage.getItem('woki.mem.v1'))?.words || {};
  } catch {}
  const recent = Object.keys(learned).sort((a, b) => learned[b] - learned[a]);
  return [...new Set([...recent, ...WORDS])].filter(word => word !== prefix && word.startsWith(prefix)).slice(0, 3);
}

function replies() {
  return RULES.find(rule => rule.k.test(conversation.context))?.s || DEFAULT;
}

function rememberSpokenWords(text) {
  try {
    const memory = JSON.parse(localStorage.getItem('woki.mem.v1')) || {words:{}, phrases:[]};
    for (const word of text.toLowerCase().match(/[a-záéíóúñü]{3,}/gu) || []) {
      if (word !== 'constructor') memory.words[word] = (Number(memory.words[word]) || 0) + 1;
    }
    memory.phrases = [{t:text, at:Date.now()}, ...memory.phrases].slice(0, 300);
    localStorage.setItem('woki.mem.v1', JSON.stringify(memory));
  } catch {}
}
