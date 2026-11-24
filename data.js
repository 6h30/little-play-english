/* Little Talk: the curriculum. Five levels, each with "worlds" (themes). Every item has an id, an English word or sentence,
   a Vietnamese gloss for the grown-up (vi), and a picture (e = emoji, c = colour, or text). */
(function () {
  'use strict';
  // A compact list: "word|Vietnamese|emoji|extra" items separated by ";"
  const W = (world, s, extra) => s.split(';').map(x => {
    const [w, vi, e, ex] = x.trim().split('|');
    const it = { id: world + ':' + w.toLowerCase().replace(/\s+/g, '-'), world, w, vi, e };
    if (e && e[0] === '#') { it.c = e; delete it.e; }
    if (ex) it.ex = ex;
    return Object.assign(it, extra && extra(it));
  });

  BE.LEVELS = [
    { n: 1, age: '1–2', name: 'Hear & Touch', vi: 'Nghe và chạm', color: '#ffd6a5', goal: 'Knows the names of about 30 everyday things.', goalVi: 'Nhận ra tên khoảng 30 đồ vật quen thuộc khi nghe.' },
    { n: 2, age: '2–3', name: 'Point & Move', vi: 'Chỉ và làm', color: '#caffbf', goal: 'Points to the right picture among several, follows simple commands.', goalVi: 'Chỉ đúng tranh trong nhiều tranh, làm theo lệnh đơn giản.' },
    { n: 3, age: '3–4', name: 'Say & Play', vi: 'Nói và chơi', color: '#9bf6ff', goal: 'Understands and copies short sentences.', goalVi: 'Hiểu và bắt chước câu ngắn.' },
    { n: 4, age: '4–5', name: 'Sounds & Letters', vi: 'Âm và chữ', color: '#bdb2ff', goal: 'Hears syllables and rhymes, knows letter names.', goalVi: 'Nghe được âm tiết, vần, biết tên chữ cái.' },
    { n: 5, age: '5+', name: 'Read & Tell', vi: 'Đọc và kể', color: '#ffc6ff', goal: 'Reads short sentences, follows a story, answers questions.', goalVi: 'Đọc câu ngắn, theo dõi truyện, trả lời câu hỏi.' }
  ];

  const worlds = [];
  const add = (w) => { worlds.push(w); return w; };

  /* ---------------- Level 1 ---------------- */
  add({ id: 'animals', level: 1, kind: 'words', name: 'Animal friends', vi: 'Bạn thú', icon: '🐶', color: '#ffe5b4',
    items: W('animals', 'dog|chó|🐶;cat|mèo|🐱;duck|vịt|🦆;cow|bò|🐮;pig|heo|🐷;fish|cá|🐟;bird|chim|🐦;frog|ếch|🐸') });
  add({ id: 'food', level: 1, kind: 'words', name: 'Yummy food', vi: 'Đồ ăn ngon', icon: '🍎', color: '#ffd1d1',
    items: W('food', 'milk|sữa|🥛;water|nước|💧;apple|táo|🍎;banana|chuối|🍌;bread|bánh mì|🍞;egg|trứng|🥚;cookie|bánh quy|🍪;cheese|phô mai|🧀') });
  add({ id: 'things', level: 1, kind: 'words', name: 'My things', vi: 'Đồ của bé', icon: '🧸', color: '#d7e8ff',
    items: W('things', 'ball|quả bóng|⚽;car|xe hơi|🚗;book|sách|📖;sock|tất|🧦;spoon|muỗng|🥄;cup|ly|🥤;teddy bear|gấu bông|🧸;bed|giường|🛏️') });
  add({ id: 'family', level: 1, kind: 'words', name: 'My family', vi: 'Gia đình', icon: '👪', color: '#e9d8ff',
    items: W('family', 'mommy|mẹ|👩;daddy|bố|👨;baby|em bé|👶;grandma|bà|👵;grandpa|ông|👴;brother|anh/em trai|👦;sister|chị/em gái|👧;hello|xin chào|👋', it => it.w === 'hello' ? { q: 'Find the one that says hello!', s: 'Hello! Hello!' } : null) });

  /* ---------------- Level 2 ---------------- */
  add({ id: 'colors', level: 2, kind: 'colors', name: 'Colours', vi: 'Màu sắc', icon: '🎨', color: '#ffe0f0',
    items: W('colors', 'red|đỏ|#e53935;blue|xanh dương|#1e88e5;yellow|vàng|#fdd835;green|xanh lá|#43a047;orange|cam|#fb8c00;purple|tím|#8e24aa;pink|hồng|#ec407a;black|đen|#212121;white|trắng|#ffffff') });
  add({ id: 'body', level: 2, kind: 'words', name: 'My body', vi: 'Cơ thể bé', icon: '👀', color: '#ffe5d9',
    items: W('body', 'eyes|mắt|👀;ears|tai|👂;nose|mũi|👃;mouth|miệng|👄;hands|bàn tay|✋;feet|bàn chân|🦶;legs|chân|🦵;arms|cánh tay|💪;teeth|răng|🦷;tongue|lưỡi|👅') });
  add({ id: 'clothes', level: 2, kind: 'words', name: 'Clothes', vi: 'Quần áo', icon: '👕', color: '#d8f3dc',
    items: W('clothes', 'shirt|áo|👕;pants|quần|👖;dress|váy|👗;shoes|giày|👟;hat|mũ|🧢;coat|áo khoác|🧥;gloves|găng tay|🧤;glasses|kính|👓') });
  add({ id: 'fruit', level: 2, kind: 'words', name: 'Fruit & veg', vi: 'Trái cây, rau', icon: '🍓', color: '#ffd6e0',
    items: W('fruit', 'orange|quả cam|🍊;grapes|nho|🍇;strawberry|dâu tây|🍓;lemon|chanh|🍋;watermelon|dưa hấu|🍉;pear|lê|🍐;cherries|cherry|🍒;carrot|cà rốt|🥕;corn|bắp|🌽;tomato|cà chua|🍅') });
  add({ id: 'zoo', level: 2, kind: 'words', name: 'Zoo & farm', vi: 'Sở thú, nông trại', icon: '🦁', color: '#fff3b0',
    items: W('zoo', 'lion|sư tử|🦁;elephant|voi|🐘;monkey|khỉ|🐵;horse|ngựa|🐴;sheep|cừu|🐑;rabbit|thỏ|🐰;bear|gấu|🐻;tiger|hổ|🐯;giraffe|hươu cao cổ|🦒;chicken|gà|🐔') });
  add({ id: 'vehicles', level: 2, kind: 'words', name: 'Things that go', vi: 'Xe cộ', icon: '🚌', color: '#cfe4ff',
    items: W('vehicles', 'bus|xe buýt|🚌;train|tàu hỏa|🚆;plane|máy bay|✈️;boat|thuyền|⛵;bike|xe đạp|🚲;truck|xe tải|🚚;helicopter|trực thăng|🚁;fire truck|xe cứu hỏa|🚒') });
  add({ id: 'actions', level: 2, kind: 'actions', name: 'Move it!', vi: 'Làm theo!', icon: '🤸', color: '#ffe8cc',
    items: W('actions', 'clap|vỗ tay|👏;jump|nhảy|🤸;sit|ngồi|🪑;stand|đứng|🧍;run|chạy|🏃;sleep|ngủ|😴;eat|ăn|🍽️;drink|uống|🥛;wave|vẫy tay|👋;dance|nhảy múa|💃',
      it => ({ cmd: { clap: 'Clap, clap, clap!', jump: 'Jump, jump, jump!', sit: 'Sit down!', stand: 'Stand up!', run: 'Run, run, run!', sleep: 'Sleepy time. Sleep!', eat: 'Yum yum! Eat!', drink: 'Glug glug! Drink!', wave: 'Wave hello!', dance: "Let's dance!" }[it.w] })) });

  /* ---------------- Level 3 ---------------- */
  const S3 = (world, list) => list.map(([s, vi, e, w]) => ({ id: world + ':' + (w || s).toLowerCase().replace(/[^a-z]+/g, '-'), world, w: w || s, s, vi, e }));
  add({ id: 'see', level: 3, kind: 'frames', name: 'I see…', vi: 'Con thấy…', icon: '👀', color: '#fff0d0', tip: 'I see a ___.',
    items: S3('see', [['I see a dog.', 'Con thấy một chú chó.', '🐶', 'dog'], ['I see a cat.', 'Con thấy một chú mèo.', '🐱', 'cat'], ['I see a ball.', 'Con thấy một quả bóng.', '⚽', 'ball'], ['I see a car.', 'Con thấy một chiếc xe.', '🚗', 'car'], ['I see a bird.', 'Con thấy một chú chim.', '🐦', 'bird'], ['I see an apple.', 'Con thấy một quả táo.', '🍎', 'apple'], ['I see a book.', 'Con thấy một quyển sách.', '📖', 'book'], ['I see a teddy bear.', 'Con thấy một chú gấu bông.', '🧸', 'teddy bear']]) });
  add({ id: 'like', level: 3, kind: 'frames', name: 'I like…', vi: 'Con thích…', icon: '💛', color: '#ffe3ec', tip: 'I like ___.',
    items: S3('like', [['I like apples.', 'Con thích táo.', '🍎', 'apples'], ['I like milk.', 'Con thích sữa.', '🥛', 'milk'], ['I like bananas.', 'Con thích chuối.', '🍌', 'bananas'], ['I like cookies.', 'Con thích bánh quy.', '🍪', 'cookies'], ['I like bread.', 'Con thích bánh mì.', '🍞', 'bread'], ['I like cheese.', 'Con thích phô mai.', '🧀', 'cheese'], ['I like grapes.', 'Con thích nho.', '🍇', 'grapes'], ['I like cars.', 'Con thích xe hơi.', '🚗', 'cars']]) });
  add({ id: 'its', level: 3, kind: 'frames', name: "It's big, it's small", vi: 'To, nhỏ, nóng, lạnh', icon: '🐘', color: '#e0f4ff', tip: 'It is ___.',
    items: S3('its', [['It is big.', 'Nó to.', '🐘', 'big'], ['It is small.', 'Nó nhỏ.', '🐜', 'small'], ['It is hot.', 'Nó nóng.', '🔥', 'hot'], ['It is cold.', 'Nó lạnh.', '🧊', 'cold'], ['It is fast.', 'Nó nhanh.', '🚀', 'fast'], ['It is slow.', 'Nó chậm.', '🐢', 'slow'], ['It is a red apple.', 'Đó là quả táo đỏ.', '🍎', 'red apple'], ['It is a yellow banana.', 'Đó là quả chuối vàng.', '🍌', 'yellow banana'], ['It is a green frog.', 'Đó là chú ếch xanh.', '🐸', 'green frog'], ['It is an orange carrot.', 'Đó là củ cà rốt cam.', '🥕', 'orange carrot']]) });
  const NUMW = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const NUMVI = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
  const NUMTH = [['', ''], ['ball', 'balls'], ['fish', 'fish'], ['apple', 'apples'], ['duck', 'ducks'], ['star', 'stars'], ['flower', 'flowers'], ['cookie', 'cookies'], ['bird', 'birds'], ['heart', 'hearts'], ['car', 'cars']];
  const NUME = ['', '⚽', '🐟', '🍎', '🦆', '⭐', '🌸', '🍪', '🐦', '❤️', '🚗'];
  add({ id: 'numbers', level: 3, kind: 'count', name: 'Count with me', vi: 'Đếm cùng bé', icon: '🔢', color: '#e6e0ff', tip: 'I have ___.',
    items: Array.from({ length: 10 }, (_, i) => { const n = i + 1; return { id: 'numbers:' + n, world: 'numbers', n, w: NUMW[n], e: NUME[n], th: NUMTH[n][n === 1 ? 0 : 1], vi: NUMVI[n], s: 'I have ' + NUMW[n] + ' ' + NUMTH[n][n === 1 ? 0 : 1] + '.' }; }) });
  add({ id: 'where', level: 3, kind: 'position', name: 'In, on, under', vi: 'Trong, trên, dưới', icon: '📦', color: '#ffeedd', tip: 'The cat is in the box.',
    items: [{ id: 'where:in', world: 'where', w: 'in', pos: 'in', s: 'The cat is in the box.', vi: 'Con mèo ở trong hộp.' },
      { id: 'where:on', world: 'where', w: 'on', pos: 'on', s: 'The cat is on the box.', vi: 'Con mèo ở trên hộp.' },
      { id: 'where:under', world: 'where', w: 'under', pos: 'under', s: 'The cat is under the box.', vi: 'Con mèo ở dưới hộp.' }] });
  add({ id: 'feel', level: 3, kind: 'frames', name: 'How do I feel?', vi: 'Bé thấy thế nào?', icon: '😀', color: '#fff9c4', tip: 'I am ___.',
    items: S3('feel', [['I am happy.', 'Con vui.', '😀', 'happy'], ['I am sad.', 'Con buồn.', '😢', 'sad'], ['I am angry.', 'Con giận.', '😠', 'angry'], ['I am sleepy.', 'Con buồn ngủ.', '😴', 'sleepy'], ['I am scared.', 'Con sợ.', '😨', 'scared'], ['I am surprised.', 'Con ngạc nhiên.', '😮', 'surprised']]) });
  add({ id: 'weather', level: 3, kind: 'frames', name: 'The weather', vi: 'Thời tiết', icon: '⛅', color: '#d6efff', tip: 'It is ___.',
    items: S3('weather', [['It is sunny.', 'Trời nắng.', '☀️', 'sunny'], ['It is rainy.', 'Trời mưa.', '🌧️', 'rainy'], ['It is windy.', 'Trời có gió.', '💨', 'windy'], ['It is cloudy.', 'Trời nhiều mây.', '☁️', 'cloudy'], ['It is snowy.', 'Trời có tuyết.', '❄️', 'snowy']]) });

  /* ---------------- Level 4 ---------------- */
  const SY = [['dog', 1, 'dog', '🐶', 'chó'], ['cat', 1, 'cat', '🐱', 'mèo'], ['apple', 2, 'ap-ple', '🍎', 'táo'], ['monkey', 2, 'mon-key', '🐵', 'khỉ'], ['banana', 3, 'ba-na-na', '🍌', 'chuối'], ['elephant', 3, 'el-e-phant', '🐘', 'voi'], ['butterfly', 3, 'but-ter-fly', '🦋', 'bướm'], ['watermelon', 4, 'wa-ter-mel-on', '🍉', 'dưa hấu'], ['helicopter', 4, 'hel-i-cop-ter', '🚁', 'trực thăng']];
  add({ id: 'syllables', level: 4, kind: 'syllables', name: 'Clap the word', vi: 'Vỗ tay theo âm tiết', icon: '👏', color: '#e5dcff',
    items: SY.map(([w, n, sp, e, vi]) => ({ id: 'syllables:' + w, world: 'syllables', w, n, sp, e, vi })) });
  const RH = [['cat', 'hat', 'bat'], ['dog', 'frog'], ['bee', 'tree'], ['moon', 'spoon'], ['boat', 'coat', 'goat'], ['star', 'car'], ['fish', 'dish'], ['mouse', 'house'], ['bear', 'chair', 'pear'], ['cake', 'snake']];
  const RHE = { cat: '🐱', hat: '🎩', bat: '🦇', dog: '🐶', frog: '🐸', bee: '🐝', tree: '🌳', moon: '🌙', spoon: '🥄', boat: '⛵', coat: '🧥', goat: '🐐', star: '⭐', car: '🚗', fish: '🐟', dish: '🍽️', mouse: '🐭', house: '🏠', bear: '🐻', chair: '🪑', pear: '🍐', cake: '🎂', snake: '🐍' };
  const rhItems = [];
  RH.forEach((g, gi) => g.forEach(w => rhItems.push({ id: 'rhymes:' + w, world: 'rhymes', w, e: RHE[w], g: gi, group: g })));
  add({ id: 'rhymes', level: 4, kind: 'rhymes', name: 'Rhyme time', vi: 'Tìm vần', icon: '🎵', color: '#ffe0f7', items: rhItems });
  const LET = 'A|apple|🍎;B|ball|⚽;C|cat|🐱;D|dog|🐶;E|egg|🥚;F|fish|🐟;G|goat|🐐;H|hat|🧢;I|ice cream|🍦;J|juice|🧃;K|kite|🪁;L|lion|🦁;M|moon|🌙;N|nose|👃;O|orange|🍊;P|pig|🐷;Q|queen|👸;R|rabbit|🐰;S|sun|☀️;T|tiger|🐯;U|umbrella|☂️;V|van|🚐;W|watch|⌚;X|box|📦;Y|yo-yo|🪀;Z|zebra|🦓'.split(';').map(x => x.split('|'));
  // A rough way to say each letter's sound with a normal voice. A real recording of each sound would be better.
  const SOUND = { A: 'ah', B: 'buh', C: 'kuh', D: 'duh', E: 'eh', F: 'fff', G: 'guh', H: 'huh', I: 'ih', J: 'juh', K: 'kuh', L: 'lll', M: 'mmm', N: 'nnn', O: 'ah', P: 'puh', Q: 'kwuh', R: 'rrr', S: 'sss', T: 'tuh', U: 'uh', V: 'vvv', W: 'wuh', X: 'ks', Y: 'yuh', Z: 'zzz' };
  const letItems = (a, b) => LET.slice(a, b).map(([L, word, e]) => ({ id: 'abc:' + L, world: 'abc' + (a / 9 + 1 | 0), L, l: L.toLowerCase(), w: L, ex: word, e, snd: SOUND[L], vi: 'chữ ' + L }));
  add({ id: 'abc1', level: 4, kind: 'letters', name: 'ABC: A to I', vi: 'Chữ A–I', icon: '🔤', color: '#d8f3dc', items: letItems(0, 9) });
  add({ id: 'abc2', level: 4, kind: 'letters', name: 'ABC: J to R', vi: 'Chữ J–R', icon: '🔠', color: '#cfe4ff', items: letItems(9, 18) });
  add({ id: 'abc3', level: 4, kind: 'letters', name: 'ABC: S to Z', vi: 'Chữ S–Z', icon: '🔡', color: '#ffe5b4', items: letItems(18, 26) });

  /* ---------------- Level 5 ---------------- */
  const R5 = [['The cat sat.', 'Con mèo ngồi.', '🐱'], ['I see a dog.', 'Con thấy một chú chó.', '🐶'], ['The sun is hot.', 'Mặt trời nóng.', '☀️'], ['I like milk.', 'Con thích sữa.', '🥛'], ['The fish can swim.', 'Cá biết bơi.', '🐟'], ['The frog can jump.', 'Ếch biết nhảy.', '🐸'], ['The bird can fly.', 'Chim biết bay.', '🐦'], ['I eat an apple.', 'Con ăn một quả táo.', '🍎'], ['A big red bus.', 'Một chiếc xe buýt đỏ to.', '🚌'], ['The moon is up.', 'Mặt trăng lên cao.', '🌙']];
  add({ id: 'read', level: 5, kind: 'read', name: 'Read it!', vi: 'Đọc câu', icon: '📖', color: '#fff0d0',
    items: R5.map(([s, vi, e], i) => ({ id: 'read:' + i, world: 'read', w: s.replace(/[.]/g, ''), s, vi, e })) });
  const TK = [['How are you?', 'Bạn khỏe không?', '🙂', 'I am fine, thank you.', ['Goodbye!', 'It is a dog.'], 'Con khỏe, cảm ơn.'], ['What is this?', 'Đây là gì?', '🍎', 'It is an apple.', ['I am five.', 'Yes, I do.'], 'Đó là quả táo.'], ['What colour is it?', 'Nó màu gì?', '⚽', 'It is red.', ['It is big.', 'I am happy.'], 'Nó màu đỏ.'], ['Do you like milk?', 'Con thích sữa không?', '🥛', 'Yes, I do.', ['It is red.', 'I see a dog.'], 'Vâng, con thích.'], ['How old are you?', 'Con mấy tuổi?', '🎂', 'I am five.', ['It is a cake.', 'I am fine.'], 'Con năm tuổi.'], ['Where is the cat?', 'Con mèo ở đâu?', '📦🐱', 'It is in the box.', ['It is red.', 'I like milk.'], 'Nó ở trong hộp.']];
  add({ id: 'talk', level: 5, kind: 'talk', name: "Let's talk", vi: 'Hỏi và đáp', icon: '💬', color: '#e0f7fa',
    items: TK.map(([q, qvi, e, a, d, avi], i) => ({ id: 'talk:' + i, world: 'talk', w: q, q, e, a, d, vi: qvi + ' → ' + avi })) });
  add({ id: 'story', level: 5, kind: 'story', name: 'Story time', vi: 'Giờ nghe truyện', icon: '📚', color: '#ffeedd',
    items: [{ id: 'story:duck', world: 'story', w: 'The Little Duck', vi: 'Chú vịt con', e: '🦆',
      pages: [['A little duck wakes up.', '🦆🌅'], ['The duck is hungry.', '🦆🍽️'], ['It sees a frog.', '🐸'], ['The frog says, "Come with me!"', '🐸💬'], ['They find some bread.', '🍞'], ['The duck is happy. Yum yum!', '🦆😀']],
      qq: { q: 'What did the duck see?', a: 'a frog', ae: '🐸', d: [['a cat', '🐱'], ['a car', '🚗']] } },
    { id: 'story:bear', world: 'story', w: "Bear's Birthday", vi: 'Sinh nhật của gấu', e: '🐻',
      pages: [['It is Bear\'s birthday.', '🐻🎂'], ['Bear has a big cake.', '🎂'], ['Rabbit gives a red ball.', '🐰⚽'], ['Duck gives a book.', '🦆📖'], ['Bear says, "Thank you!"', '🐻💛'], ['Everyone sings and claps.', '🎶👏']],
      qq: { q: 'What did Rabbit give Bear?', a: 'a red ball', ae: '⚽', d: [['a book', '📖'], ['a hat', '🧢']] } }] });

  BE.WORLDS = worlds;
  BE.world = id => worlds.find(w => w.id === id);
  BE.ITEMS = {}; worlds.forEach(w => w.items.forEach(it => { it.wid = w.id; BE.ITEMS[it.id] = it; }));
  BE.NUMW = NUMW;
  // Short break actions (not graded)
  BE.BREAKS = [['clap', 'Clap, clap, clap!', '👏'], ['jump', 'Jump, jump, jump!', '🤸'], ['dance', "Let's dance!", '💃'], ['wave', 'Wave hello!', '👋'], ['spin', 'Spin around!', '🌀'], ['stretch', 'Stretch up high!', '🙆']];
})();
