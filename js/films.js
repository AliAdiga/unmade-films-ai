// The film archive: one record per film, shared by the film pages.
// Everything here comes from the site's own copy and media; nothing is invented.
window.UF_FILMS = [
  { slug: 'empty-chair', title: 'Empty Chair', cat: 'Education campaign', dur: '0:48', yt: 'XL-Dbws9J0c', ratio: '4 / 3',
    poster: 'media/p_sadaqaty.webp', alt: 'A hall of graduates in caps and gowns',
    desc: 'Every dinar fills a seat. A campaign that keeps students in university, told through the seat they almost left empty.',
    stills: [
      { src: 'media/s_light.webp', step: 2, cap: 'Frame and light: students around an empty bench in low sun.' },
      { src: 'media/s_direct.webp', step: 4, cap: 'Direct: students in a lecture hall.' }
    ] },
  { slug: 'trophy', title: 'Trophy', cat: 'Sport', dur: '0:47', yt: 'Mqzovf1Fnyc', ratio: '16 / 9',
    poster: 'media/p_trophy.webp', alt: 'A silver trophy under stadium lights',
    desc: 'Desert craft, from the first pencil line to stadium light.',
    sketch: { src: 'media/s_brief.webp', label: 'Pencil sketch' },
    stills: [
      { src: 'media/s_brief.webp', step: 1, cap: 'Brief and treatment: a pencil sketch of the trophy design.' },
      { src: 'media/s_generate.webp', step: 3, cap: 'Generate: a macro of the engraved silver surface.' }
    ] },
  { slug: 'jo80', title: 'JO80', cat: 'Culture', dur: '1:27', yt: 'h17MI-oDwzI', ratio: '16 / 9',
    poster: 'media/p_jo80.webp', alt: 'A young officer in dress uniform',
    desc: 'Eighty years of independence, in the faces of Jordan.', stills: [] },
  { slug: 'khamzat', title: 'Khamzat', cat: 'Sport', dur: '0:14', yt: 'DMqowjpVrE8', ratio: '16 / 9',
    poster: 'media/p_khamzat.webp', alt: 'An illustrated fighter in a wolf cloak',
    desc: 'Borz. The fighter as the wolf, in an illustrated world.', stills: [] },
  { slug: 'khamrah-dukhan', title: 'Khamrah Dukhan', cat: 'Fragrance', dur: '0:30', yt: 'hsQ3gnZZt9s', ratio: '16 / 9',
    poster: 'media/p_khamrah.webp', alt: 'A perfume bottle in smoke',
    desc: 'One bottle. Smoke, amber and stone.',
    stills: [{ src: 'media/s_deliver.webp', step: 6, tall: true, cap: 'Deliver: the bottle on dark stone, mastered as a 9:16 vertical.' }] },
  { slug: 'ard', title: 'ARD', cat: 'Food', dur: '0:32', yt: 'Y3uw2Iru2sk', ratio: '16 / 9',
    poster: 'media/p_ard.webp', alt: 'Olive trees in morning mist',
    desc: 'From hand to hand. An olive oil film, grove to table.',
    stills: [{ src: 'media/s_post.webp', step: 5, cap: 'Edit, grade, sound: olive oil pouring from the press.' }] },
  { slug: 'fear', title: 'Fear', cat: 'Short film', dur: '0:30', yt: '5veRChUHfp8', ratio: '16 / 9',
    poster: 'media/p_fear.webp', alt: 'A woman alone in a lit apartment window',
    desc: 'One lit window in a dark city, and the person inside it.', stills: [] }
];
window.UF_STEPS = ['Brief and treatment', 'Frame and light', 'Generate', 'Direct', 'Edit, grade, sound', 'Deliver'];
