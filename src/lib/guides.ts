/**
 * Aircond buying / care guides — content hub data (GEO V2 §7).
 *
 * All copy is editorial and factual; no fabricated prices, stock or dealer
 * claims. Internal links point to stable, real routes (catalogue, brands,
 * parts, service-area, wholesale hub, contact) so the hub strengthens the
 * site's internal linking without risking broken links to unknown slugs.
 *
 * To add a guide: append an entry here. The hub and article pages render
 * purely from this array, so no page code changes are required.
 */
import type { Locale } from './i18n';

export type GuideLink = {
  label: Record<Locale, string>;
  href: (lang: Locale) => string;
};

export type Guide = {
  slug: string;
  /** Short label used in nav / breadcrumbs. */
  title: Record<Locale, string>;
  /** One-line summary for the hub cards. */
  excerpt: Record<Locale, string>;
  sections: { heading: Record<Locale, string>; body: Record<Locale, string> }[];
  relatedLinks: GuideLink[];
};

const L = {
  products: (l: Locale) => `/${l}/products`,
  parts: (l: Locale) => `/${l}/parts`,
  brands: (l: Locale, slug: string) => `/${l}/brands/${slug}`,
  serviceArea: (l: Locale) => `/${l}/service-area`,
  wholesale: (l: Locale) => `/${l}/aircond-wholesale-malaysia`,
  project: (l: Locale) => `/${l}/project-supply`,
  contact: (l: Locale) => `/${l}/contact`,
  faq: (l: Locale) => `/${l}/faq`,
  locations: (l: Locale) => `/${l}/locations`,
};

export const GUIDES: Guide[] = [
  {
    slug: 'best-aircond-malaysian-homes',
    title: { en: 'Best Aircond Options for Malaysian Homes', bm: 'Pilihan Aircond Terbaik untuk Rumah Malaysia', zh: '马来西亚家庭最佳冷气选择' },
    excerpt: {
      en: 'How to match an air conditioner to a Malaysian home — climate, room types and the split / cassette options ATORA supplies.',
      bm: 'Cara memadankan penyaman udara dengan rumah Malaysia — iklim, jenis bilik dan pilihan split / kaset yang dibekalkan ATORA.',
      zh: '如何将冷气机与马来西亚家庭匹配 —— 气候、房间类型，以及 ATORA 供应的分体式/嵌入式等方案。',
    },
    sections: [
      {
        heading: { en: 'Start with Malaysia’s climate', bm: 'Mulakan dengan iklim Malaysia', zh: '从马来西亚的气候出发' },
        body: {
          en: 'Malaysia is hot and humid all year, so cooling capacity and dehumidification matter more than in temperate countries. A unit that is too small will run constantly and wear out; one that is too large will short-cycle and leave the room clammy. ATORA supplies wall-mounted split units, ceiling cassettes and floor-standing models to suit different rooms.',
          bm: 'Malaysia panas dan lembap sepanjang tahun, jadi kapasiti penyejukan dan penyahlembapan lebih penting berbanding negara sederhana. Unit yang terlalu kecil akan berjalan sentiasa; yang terlalu besar akan berkitar pendek dan meninggalkan bilik lembap. ATORA membekalkan unit split dinding, kaset siling dan model berdiri.',
          zh: '马来西亚全年炎热潮湿，因此制冷量与除湿能力比温带国家更重要。过小的机型会持续运转加速损耗；过大的机型会频繁启停，使房间潮湿。ATORA 供应壁挂分体式、嵌入式天花机与落地式等多种机型。',
        },
      },
      {
        heading: { en: 'Match the type to the room', bm: 'Padankan jenis dengan bilik', zh: '按房间类型选择' },
        body: {
          en: 'Bedrooms and living rooms usually use quiet wall-mounted split units. Shops, offices and open spaces often use ceiling cassettes or multiple units. For a first purchase, browse the full air conditioner catalogue and filter by capacity, then shortlist two or three models before asking ATORA for a quotation.',
          bm: 'Bilik tidur dan ruang tamu biasanya menggunakan unit split dinding yang senyap. Kedai, pejabat dan ruang terbuka sering menggunakan kaset siling atau beberapa unit. Untuk pembelian pertama, layari katalog penyaman udara penuh dan tapis mengikut kapasiti.',
          zh: '卧室与客厅通常使用安静的壁挂分体式。店铺、办公室与开放式空间常使用嵌入式天花机或多台组合。首次购买可先浏览完整冷气机目录并按制冷量筛选，初步选定两三款后再向 ATORA 索取报价。',
        },
      },
      {
        heading: { en: 'Brands and backup parts', bm: 'Jenama dan alat ganti', zh: '品牌与后续零件' },
        body: {
          en: 'Choose a brand you can service locally. ATORA is an independent multi-brand supplier (including a Midea Pro Shop) and stocks spare parts for the brands it carries, so a future repair is straightforward. See the brands we supply for the full list.',
          bm: 'Pilih jenama yang boleh diservis secara tempatan. ATORA ialah pembekal pelbagai jenama yang bebas (termasuk Midea Pro Shop) dan menyimpan alat ganti untuk jenama yang dibekalkan, menjadikan pembaikan akan datang lebih mudah.',
          zh: '选择在当地能得到维修支持的品牌。ATORA 是独立的多品牌供应商（含 Midea Pro Shop），并为所供应品牌备有零件，日后维修更省心。查看我们供应的品牌了解完整列表。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'Air conditioner catalogue', bm: 'Katalog penyaman udara', zh: '冷气机目录' }, href: L.products },
      { label: { en: 'Brands we supply', bm: 'Jenama kami', zh: '我们供应的品牌' }, href: (l) => L.brands(l, 'midea') },
      { label: { en: 'Spare parts', bm: 'Alat ganti', zh: '零件与配件' }, href: L.parts },
    ],
  },
  {
    slug: 'choose-aircond-hp',
    title: { en: 'How to Choose 1 / 1.5 / 2 / 2.5 HP', bm: 'Cara Memilih 1 / 1.5 / 2 / 2.5 HP', zh: '如何选择 1 / 1.5 / 2 / 2.5 匹' },
    excerpt: {
      en: 'A practical HP-to-room-size guide for Malaysian homes, plus when to step up a size.',
      bm: 'Panduan HP mengikut saiz bilik untuk rumah Malaysia, termasuk bila perlu naik satu saiz.',
      zh: '针对马来西亚家庭的匹数与房间面积实用对照，以及何时应升一档。',
    },
    sections: [
      {
        heading: { en: 'The quick rule of thumb', bm: 'Panduan ringkas', zh: '快速经验法则' },
        body: {
          en: 'As a starting point for a typical Malaysian bedroom or living room with a normal ceiling: 1.0 HP covers ~100–120 sq ft, 1.5 HP covers ~120–170 sq ft, 2.0 HP covers ~170–230 sq ft, and 2.5 HP covers ~230–300 sq ft. High ceilings, glass walls, direct sun or a kitchen nearby all push you up a size.',
          bm: 'Sebagai permulaan untuk bilik tidur atau ruang tamu biasa dengan siling biasa: 1.0 HP ~100–120 kps, 1.5 HP ~120–170 kps, 2.0 HP ~170–230 kps, dan 2.5 HP ~230–300 kps. Siling tinggi, dinding kaca, cahaya matahari terus atau dapur berdekatan menaikkan satu saiz.',
          zh: '以普通层高、普通马来西亚卧室或客厅为基准：1.0 匹约 100–120 平方尺，1.5 匹约 120–170 平方尺，2.0 匹约 170–230 平方尺，2.5 匹约 230–300 平方尺。挑高天花、玻璃幕墙、西晒或邻近厨房都应升一档。',
        },
      },
      {
        heading: { en: 'When to size up', bm: 'Bila perlu naik saiz', zh: '何时应加大' },
        body: {
          en: 'If the room has a large window facing the afternoon sun, is on the top floor, or is used by several people, add ~0.5 HP. It is cheaper to buy the right size once than to run an underpowered unit all day. ATORA can quote the matching model once you share the room dimensions.',
          bm: 'Jika bilik mempunyai tingkap besar menghadap matahari petang, di tingkat atas, atau digunakan oleh beberapa orang, tambah ~0.5 HP. Lebih murah membeli saiz betul sekali berbanding menjalankan unit tidak cukup kuasa sepanjang hari.',
          zh: '若房间有大面西晒窗、位于顶楼或多人同时使用，建议增加约 0.5 匹。一次选对尺寸，比长期用小功率机型更划算。把房间尺寸告诉 ATORA，即可获得对应机型报价。',
        },
      },
      {
        heading: { en: 'See real models', bm: 'Lihat model sebenar', zh: '查看实际机型' },
        body: {
          en: 'Filter the air conditioner catalogue by capacity to compare 1.0 / 1.5 / 2.0 / 2.5 HP units side by side, then contact ATORA for wholesale or retail pricing.',
          bm: 'Tapis katalog penyaman udara mengikut kapasiti untuk membanding unit 1.0 / 1.5 / 2.0 / 2.5 HP, kemudian hubungi ATORA untuk harga borong atau runcit.',
          zh: '在冷气机目录中按制冷量筛选，将 1.0 / 1.5 / 2.0 / 2.5 匹机型并排比较，再联系 ATORA 获取批发或零售价。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'Air conditioner catalogue', bm: 'Katalog penyaman udara', zh: '冷气机目录' }, href: L.products },
      { label: { en: 'Get a quotation', bm: 'Dapatkan sebut harga', zh: '获取报价' }, href: L.contact },
    ],
  },
  {
    slug: 'inverter-vs-non-inverter',
    title: { en: 'Inverter vs Non-Inverter Aircond', bm: 'Aircond Inverter vs Bukan Inverter', zh: '变频与定频冷气对比' },
    excerpt: {
      en: 'The real difference in comfort, noise and electricity bills — and which to pick for a Malaysian home.',
      bm: 'Beza sebenar dari segi keselesaan, bunyi dan bil elektrik — serta yang mana sesuai untuk rumah Malaysia.',
      zh: '在舒适度、噪音与电费上的真实差别 —— 以及马来西亚家庭该如何选。',
    },
    sections: [
      {
        heading: { en: 'How they work', bm: 'Cara ia berfungsi', zh: '工作原理' },
        body: {
          en: 'A non-inverter (fixed-speed) unit runs the compressor at full power then switches off when the room is cool, repeating the cycle. An inverter unit varies the compressor speed to hold a steady temperature. Inverter models are generally quieter and use less electricity over a long run.',
          bm: 'Unit bukan inverter (kelajuan tetap) menjalankan pemampat pada kuasa penuh kemudian mematikan apabila bilik sejuk, berulang kitaran. Unit inverter mengubah kelajuan pemampat untuk mengekalkan suhu stabil. Model inverter biasanya lebih senyap dan menjimatkan elektrik dalam jangka panjang.',
          zh: '定频（固定转速）机型在房间达到温度后停机，之后反复启停。变频机型则调节压缩机转速以保持恒温。变频一般更安静，长时间使用更省电。',
        },
      },
      {
        heading: { en: 'Which should you choose', bm: 'Yang mana patut dipilih', zh: '该如何选择' },
        body: {
          en: 'If the unit runs many hours a day (a bedroom used nightly, or a home office), an inverter usually pays back its higher upfront cost through lower bills. For a rarely used room, a non-inverter can be the simpler, lower-cost choice. ATORA supplies both types across its brands.',
          bm: 'Jika unit berjalan banyak jam sehari (bilik tidur setiap malam, atau pejabat rumah), inverter biasanya balik modal melalui bil yang lebih rendah. Untuk bilik jarang digunakan, bukan inverter mungkin pilihan lebih mudah dan murah.',
          zh: '若每天长时间运行（如每晚使用的卧室或家庭办公室），变频通常能以更低电费收回较高的一次性成本。使用频率低的房间，定频更经济简单。ATORA 各品牌均同时供应两种类型。',
        },
      },
      {
        heading: { en: 'Compare models', bm: 'Bandingkan model', zh: '比较机型' },
        body: {
          en: 'Browse the catalogue and check each product’s description for the inverter / non-inverter type, then ask ATORA for the best available pricing on the model you prefer.',
          bm: 'Layari katalog dan semak penerangan setiap produk untuk jenis inverter / bukan inverter, kemudian tanya ATORA harga terbaik untuk model pilihan anda.',
          zh: '浏览目录并查看每款产品的描述确认变频/定频类型，再向 ATORA 询问心仪机型的优惠价格。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'Air conditioner catalogue', bm: 'Katalog penyaman udara', zh: '冷气机目录' }, href: L.products },
      { label: { en: 'Wholesale aircond', bm: 'Borong aircond', zh: '冷气批发' }, href: L.wholesale },
    ],
  },
  {
    slug: 'aircond-for-bedroom',
    title: { en: 'Aircond for Bedroom', bm: 'Aircond untuk Bilik Tidur', zh: '卧室冷气选购' },
    excerpt: {
      en: 'Quiet, healthy and right-sized cooling for the room you sleep in most.',
      bm: 'Penyejukan yang senyap, sihat dan bersaiz betul untuk bilik tidur anda.',
      zh: '为您最常入睡的房间提供安静、健康且尺寸合适的制冷。',
    },
    sections: [
      {
        heading: { en: 'Quiet matters most', bm: 'Kesunyian paling penting', zh: '安静最关键' },
        body: {
          en: 'A bedroom unit runs while you sleep, so check the noise level (dB) in the product description and prefer a model with a quiet / sleep mode. Inverter units also tend to be quieter because the compressor does not hard-start.',
          bm: 'Unit bilik tidur berjalan ketika anda tidur, jadi semak tahap bunyi (dB) dalam penerangan produk dan pilih model dengan mod senyap / tidur. Unit inverter juga cenderung lebih senyap kerana pemampat tidak bermula kuat.',
          zh: '卧室机型在您睡眠时持续运行，请查看产品描述中的噪音值（dB），并优先选择带静音/睡眠模式的机型。变频机型因压缩机不会硬启动，通常也更安静。',
        },
      },
      {
        heading: { en: 'Size for the bedroom', bm: 'Saiz untuk bilik tidur', zh: '卧室的尺寸' },
        body: {
          en: 'Most Malaysian bedrooms suit 1.0–1.5 HP. A master bedroom with an attached bathroom or a glass wall may need 1.5–2.0 HP. Use the HP-to-room-size guide to confirm, then compare models in the catalogue.',
          bm: 'Kebanyakan bilik tidur Malaysia sesuai 1.0–1.5 HP. Bilik tidur utama dengan bilik air atau dinding kaca mungkin perlu 1.5–2.0 HP. Gunakan panduan HP-mengikut-saiz bilik untuk sahkan.',
          zh: '多数马来西亚卧室适合 1.0–1.5 匹；带独立卫生间或玻璃墙的主卧可能需要 1.5–2.0 匹。可参考匹数对照指南确认后，再在目录中比较机型。',
        },
      },
      {
        heading: { en: 'Keep it healthy', bm: 'Kekalkan kesihatan', zh: '保持空气健康' },
        body: {
          en: 'Clean or replace the filter regularly and service the unit yearly. ATORA stocks filters and spare parts so routine maintenance stays easy.',
          bm: 'Bersihkan atau ganti penapis secara kerap dan servis unit setiap tahun. ATORA menyimpan penapis dan alat ganti supaya penyelenggaraan rutin kekal mudah.',
          zh: '定期清洁或更换滤网，并每年保养一次。ATORA 备有滤网与零件，让日常维护更简单。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'HP size guide', bm: 'Panduan saiz HP', zh: '匹数选择指南' }, href: (l) => `/${l}/aircond-guide/choose-aircond-hp` },
      { label: { en: 'Spare parts', bm: 'Alat ganti', zh: '零件与配件' }, href: L.parts },
      { label: { en: 'Maintenance guide', bm: 'Panduan penyelenggaraan', zh: '保养指南' }, href: (l) => `/${l}/aircond-guide/maintenance-guide` },
    ],
  },
  {
    slug: 'kedah-homes-buying-guide',
    title: { en: 'Buying Guide for Kedah Homes', bm: 'Panduan Pembelian untuk Rumah di Kedah', zh: '吉打州家庭购买指南' },
    excerpt: {
      en: 'Local buying notes for Kedah and Northern Malaysia — from ATORA’s Padang Serai HQ.',
      bm: 'Nota pembelian tempatan untuk Kedah dan Utara Malaysia — dari Ibu Pejabat ATORA di Padang Serai.',
      zh: '吉打州与北马地区的本地购买建议 —— 来自 ATORA Padang Serai 总部。',
    },
    sections: [
      {
        heading: { en: 'Buy close to home', bm: 'Beli berdekatan rumah', zh: '就近购买' },
        body: {
          en: 'ATORA is based in Kedah (Padang Serai HQ, with Kulim and Sungai Petani branches), so Kedah and Northern Malaysia customers get fast quotation, collection and spare-parts support. See the Northern Malaysia service area for the full coverage.',
          bm: 'ATORA berpangkalan di Kedah (Ibu Pejabat Padang Serai, dengan cawangan Kulim dan Sungai Petani), jadi pelanggan Kedah dan Utara Malaysia mendapat sebut harga, pengambilan dan sokongan alat ganti pantas.',
          zh: 'ATORA 总部位于吉打州（Padang Serai 总部，另设 Kulim 与 Sungai Petani 分店），因此吉打与北马客户可获得快速报价、自取与零件支持。查看北马服务区域了解完整覆盖范围。',
        },
      },
      {
        heading: { en: 'Pick for the heat', bm: 'Pilih untuk cuaca panas', zh: '针对炎热气候' },
        body: {
          en: 'Kedah’s hot, humid weather favours correctly sized inverter units for bedrooms and living areas. If you are unsure of the size, use the HP guide or send ATORA your room dimensions for a recommendation.',
          bm: 'Cuaca panas dan lembap Kedah memihak kepada unit inverter bersaiz betul untuk bilik tidur dan ruang tamu. Jika tidak pasti saiz, gunakan panduan HP atau hantar dimensi bilik kepada ATORA.',
          zh: '吉打炎热潮湿的气候更适合卧室与客厅选用尺寸合适的变频机型。若不确定尺寸，可参考匹数指南，或将房间尺寸发给 ATORA 获取建议。',
        },
      },
      {
        heading: { en: 'Support after purchase', bm: 'Sokongan selepas pembelian', zh: '售后支持' },
        body: {
          en: 'Because ATORA stocks spare parts locally, future repairs for Kedah homes are quick. Browse the catalogue, then visit a branch or contact us for a quotation.',
          bm: 'Oleh kerana ATORA menyimpan alat ganti secara tempatan, pembaikan akan datang untuk rumah Kedah adalah pantas. Layari katalog, kemudian kunjungi cawangan atau hubungi kami untuk sebut harga.',
          zh: '由于 ATORA 在本地备有零件，吉打家庭日后的维修更迅速。浏览目录后，可前往分店或联系我们获取报价。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'Northern Malaysia service area', bm: 'Kawasan Utara Malaysia', zh: '北马服务区域' }, href: L.serviceArea },
      { label: { en: 'Our locations', bm: 'Cawangan kami', zh: '我们的分店' }, href: L.locations },
      { label: { en: 'Air conditioner catalogue', bm: 'Katalog penyaman udara', zh: '冷气机目录' }, href: L.products },
    ],
  },
  {
    slug: 'spare-parts-guide',
    title: { en: 'Aircond Spare Parts Guide', bm: 'Panduan Alat Ganti Aircond', zh: '冷气零件指南' },
    excerpt: {
      en: 'The common parts that fail, how to identify them, and how ATORA keeps them in stock.',
      bm: 'Alat ganti yang biasa rosak, cara mengenal pasti, dan bagaimana ATORA menyimpannya.',
      zh: '常见易损零件、如何识别，以及 ATORA 如何保持库存。',
    },
    sections: [
      {
        heading: { en: 'Common wear items', bm: 'Alat ganti lazim', zh: '常见易损件' },
        body: {
          en: 'The parts most often replaced are filters, capacitors, fan motors, PCB boards, sensors, remote controls and drain hoses. Knowing the model number (on the indoor unit label) makes finding the right part much faster.',
          bm: 'Alat ganti yang paling kerap diganti ialah penapis, kapasitor, motor kipas, papan PCB, sensor, alat kawalan jauh dan hos saliran. Mengetahui nombor model (pada label unit dalaman) menjadikan carian alat ganti lebih pantas.',
          zh: '最常更换的零件包括滤网、电容、风扇马达、电路板、传感器、遥控器和排水管。记下型号（室内机标签上）能更快找到正确零件。',
        },
      },
      {
        heading: { en: 'Identify by photo', bm: 'Kenal pasti melalui foto', zh: '通过照片识别' },
        body: {
          en: 'If you are not sure what the part is, upload a photo through ATORA’s quick enquiry and the team will identify it. The spare-parts catalogue lists the main categories ATORA carries.',
          bm: 'Jika tidak pasti jenis alat ganti, muat naik foto melalui pertanyaan pantas ATORA dan pasukan akan kenal pasti. Katalog alat ganti menyenaraikan kategori utama yang dibekalkan ATORA.',
          zh: '若不确定零件种类，可通过 ATORA 快速询价上传照片，团队将为您识别。零件目录列出了 ATORA 供应的主要类别。',
        },
      },
      {
        heading: { en: 'Genuine vs compatible', bm: 'Tulen vs serasi', zh: '原厂与兼容' },
        body: {
          en: 'ATORA supplies genuine and compatible spare parts for the brands it carries. Ask which option suits your unit and budget when you enquire — no brand-authorised-dealer claim is made, just practical supply.',
          bm: 'ATORA membekalkan alat ganti tulen dan serasi untuk jenama yang dibawanya. Tanya pilihan yang sesuai dengan unit dan bajet anda — tiada dakwaan pengedar sah jenama, hanya bekalan praktikal.',
          zh: 'ATORA 为所供应品牌提供原厂与兼容零件。询价时可询问哪种更适合您的机型与预算 —— 这里只做实际供应，不主张任何品牌授权经销。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'Spare parts catalogue', bm: 'Katalog alat ganti', zh: '零件目录' }, href: L.parts },
      { label: { en: 'Contact ATORA', bm: 'Hubungi ATORA', zh: '联系 ATORA' }, href: L.contact },
    ],
  },
  {
    slug: 'midea-aircond-guide',
    title: { en: 'Midea Aircond Guide', bm: 'Panduan Aircond Midea', zh: 'Midea 冷气指南' },
    excerpt: {
      en: 'What ATORA offers as a Midea Pro Shop — ranges, inverter options and parts.',
      bm: 'Apa yang ditawarkan ATORA sebagai Midea Pro Shop — julat, pilihan inverter dan alat ganti.',
      zh: 'ATORA 作为 Midea Pro Shop 提供什么 —— 系列、变频选项与零件。',
    },
    sections: [
      {
        heading: { en: 'ATORA as a Midea Pro Shop', bm: 'ATORA sebagai Midea Pro Shop', zh: 'ATORA 作为 Midea Pro Shop' },
        body: {
          en: 'ATORA operates a Midea Pro Shop, supplying Midea air conditioners and supporting them with spare parts and accessories. ATORA is an independent supplier and is not an authorised distributor of Midea; it simply carries and supports the brand.',
          bm: 'ATORA mengendalikan Midea Pro Shop, membekalkan penyaman udara Midea dan menyokongnya dengan alat ganti dan aksesori. ATORA ialah pembekal bebas dan bukan pengedar sah Midea; ia hanya membawa dan menyokong jenama tersebut.',
          zh: 'ATORA 经营 Midea Pro Shop，供应 Midea 冷气机并提供零件与配件支持。ATORA 是独立供应商，并非 Midea 授权经销商，只是供应并支持该品牌。',
        },
      },
      {
        heading: { en: 'What to look for', bm: 'Apa yang dicari', zh: '选购要点' },
        body: {
          en: 'Like other brands, Midea offers inverter and non-inverter wall-mounted splits in 1.0–2.5 HP and larger. Check the product page for capacity, inverter type and the functions you need (sleep mode, WiFi, etc.).',
          bm: 'Seperti jenama lain, Midea menawarkan split dinding inverter dan bukan inverter dalam 1.0–2.5 HP dan lebih besar. Semak halaman produk untuk kapasiti, jenis inverter dan fungsi diperlukan.',
          zh: '与其他品牌一样，Midea 提供 1.0–2.5 匹及以上的变频与定频壁挂分体式。请在产品页确认制冷量、变频类型及所需功能（睡眠模式、WiFi 等）。',
        },
      },
      {
        heading: { en: 'Parts and support', bm: 'Alat ganti dan sokongan', zh: '零件与支持' },
        body: {
          en: 'Because ATORA is a Midea Pro Shop, Midea spare parts are stocked locally for faster repairs. Browse the Midea brand page or the spare-parts catalogue to see what is available.',
          bm: 'Oleh kerana ATORA ialah Midea Pro Shop, alat ganti Midea disimpan secara tempatan untuk pembaikan lebih pantas. Layari halaman jenama Midea atau katalog alat ganti untuk lihat stok.',
          zh: '由于 ATORA 是 Midea Pro Shop，Midea 零件在本地备货，维修更快。可浏览 Midea 品牌页或零件目录查看可用项目。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'Midea brand page', bm: 'Halaman jenama Midea', zh: 'Midea 品牌页' }, href: (l) => L.brands(l, 'midea') },
      { label: { en: 'Spare parts', bm: 'Alat ganti', zh: '零件与配件' }, href: L.parts },
      { label: { en: 'Air conditioner catalogue', bm: 'Katalog penyaman udara', zh: '冷气机目录' }, href: L.products },
    ],
  },
  {
    slug: 'maintenance-guide',
    title: { en: 'Aircond Maintenance Guide', bm: 'Panduan Penyelenggaraan Aircond', zh: '冷气保养指南' },
    excerpt: {
      en: 'Simple habits that keep an air conditioner efficient, quiet and long-lasting.',
      bm: 'Tabiat mudah yang mengekalkan penyaman udara cekap, senyap dan tahan lama.',
      zh: '让冷气机保持高效、安静与耐用的简单习惯。',
    },
    sections: [
      {
        heading: { en: 'Clean the filter regularly', bm: 'Bersihkan penapis secara kerap', zh: '定期清洁滤网' },
        body: {
          en: 'A clogged filter reduces cooling and raises electricity use. Rinse the filter every 2–4 weeks during heavy use; replacement filters are available from ATORA’s spare-parts catalogue.',
          bm: 'Penapis tersumbat mengurangkan penyejukan dan menaikkan penggunaan elektrik. Bilas penapis setiap 2–4 minggu semasa penggunaan berat; penapis ganti tersedia dari katalog alat ganti ATORA.',
          zh: '滤网堵塞会降低制冷效果并增加耗电。高频使用期间每 2–4 周冲洗一次滤网；替换滤网可在 ATORA 零件目录获取。',
        },
      },
      {
        heading: { en: 'Yearly professional service', bm: 'Servis profesional tahunan', zh: '每年专业保养' },
        body: {
          en: 'Once a year, have the unit checked: coil cleaning, gas-pressure check and drainage inspection prevent most breakdowns. ATORA’s technical partner network can help with installation and servicing.',
          bm: 'Setahun sekali, periksa unit: pembersihan gegelung, semakan tekanan gas dan pemeriksaan saliran mencegah kebanyakan kerosakan. Rangkaian rakan teknikal ATORA boleh membantu pemasangan dan servis.',
          zh: '每年进行一次检查：清洗换热器、检测冷媒压力与排水，可预防大多数故障。ATORA 的技术合作伙伴网络可协助安装与保养。',
        },
      },
      {
        heading: { en: 'Watch for warning signs', bm: 'Perhatikan tanda amaran', zh: '留意警示信号' },
        body: {
          en: 'Weak cooling, unusual noise, water leakage or a musty smell mean it is time to service or replace a part. Upload a photo to ATORA’s quick enquiry to identify the likely part.',
          bm: 'Penyejukan lemah, bunyi luar biasa, kebocoran air atau bau hapak menandakan masa untuk servis atau ganti alat ganti. Muat naik foto ke pertanyaan pantas ATORA untuk kenal pasti alat ganti.' ,
          zh: '制冷变弱、异响、漏水或霉味，都提示需要保养或更换零件。可通过 ATORA 快速询价上传照片，识别可能的零件。',
        },
      },
    ],
    relatedLinks: [
      { label: { en: 'Spare parts', bm: 'Alat ganti', zh: '零件与配件' }, href: L.parts },
      { label: { en: 'Technical partners', bm: 'Rakan teknikal', zh: '技术合作伙伴' }, href: L.locations },
      { label: { en: 'Contact ATORA', bm: 'Hubungi ATORA', zh: '联系 ATORA' }, href: L.contact },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
