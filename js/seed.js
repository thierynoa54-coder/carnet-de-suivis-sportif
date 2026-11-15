// ============================================================
// DONNÉES SEED — extraites du programme Word original
// Ce fichier n'est utilisé que la première fois (si aucune donnée
// n'existe encore dans le stockage du téléphone). Ensuite tout
// est modifiable et sauvegardé localement.
// ============================================================

export const SEED_DATA = {
  profile: {
    age: "18-22 ans",
    taille_poids: "1,77 m / 106-108 kg",
    poids_kg: 107,
    niveau: "Quelques mois d'expérience",
    blessures: "Aucune",
    acces_salle: "3-4 jours / semaine"
  },

  methode: [
    "Carnet d'entraînement obligatoire : note à chaque séance le poids, les reps, et une note de difficulté (RPE de 1 à 10 — 10 étant l'échec total).",
    "Règle des 2 pour 2 : si tu réalises 2 répétitions de plus que ton objectif sur 2 séances consécutives sur un exercice, tu augmentes la charge de 2,5 à 5 % la séance suivante.",
    "Trois leviers de progression, dans cet ordre de priorité : 1) qualité d'exécution, 2) répétitions à charge égale, 3) charge (en redescendant légèrement les répétitions).",
    "Cycle de 4 semaines : 3 semaines de montée en charge/volume, puis 1 semaine de décharge (volume -40%, intensité -20%).",
    "Cardio : progresse en réduisant le repos avant d'augmenter la durée de travail, puis augmente la durée.",
    "Poids du corps : progresse via les tempos (3-4 s excentrique), les amplitudes (déficit, pause en bas), puis les variantes plus difficiles."
  ],

  weeklyPlan: [
    { day: "Lundi",    program: "C1", location: "Salle",       duration: "60-70 min" },
    { day: "Mardi",    program: "A",  location: "Maison",      duration: "40-50 min" },
    { day: "Mercredi", program: "C2", location: "Salle",       duration: "60-70 min" },
    { day: "Jeudi",    program: "B",  location: "Maison",      duration: "25-30 min" },
    { day: "Vendredi", program: "D",  location: "Salle",       duration: "45-55 min" },
    { day: "Samedi",   program: "A",  location: "Maison/Club", duration: "40-50 min" },
    { day: "Dimanche", program: "B",  location: "—",           duration: "0-25 min" }
  ],

  programs: {
    A: {
      name: "Programme A — Poids du corps", met: 6,
      subtitle: "Sans matériel — jours sans accès à la salle",
      location: "Maison",
      duration: "40-50 min",
      warmup: "5-7 min : rotations articulaires (cou, épaules, hanches, chevilles), 20 squats à vide, 10 burpees lents, montées de genoux.",
      note: "Astuce anti-crampes : hydrate-toi avant la séance, ajoute une pincée de sel dans ton eau si tu transpires beaucoup — à 108 kg tu perds davantage de sodium que la moyenne.",
      exercises: [
        { id:"a1", m:["poitrine", "bras", "epaules"], name:"Pompes (large/serré alterné)", desc:"Mains légèrement plus larges que les épaules, descente poitrine proche du sol, gainage rigide.", sets:"4 x 12-15", rest:"60 s" },
        { id:"a2", m:["jambes", "mollets", "fessiers"], name:"Squats sautés", desc:"Squat à 90°, saut explosif, réception souple genoux fléchis.", sets:"4 x 10", rest:"75 s" },
        { id:"a3", m:["abdos"], name:"Gainage planche + rotation", desc:"Planche classique, puis rotation latérale en touchant l'épaule opposée.", sets:"3 x 30-40 s", rest:"45 s" },
        { id:"a4", m:["jambes", "fessiers"], name:"Fentes avant alternées", desc:"Pas long, genou arrière proche du sol sans le toucher, buste droit.", sets:"3 x 12/jambe", rest:"60 s" },
        { id:"a5", m:["bras", "poitrine"], name:"Pompes diamant", desc:"Mains jointes sous le sternum, triceps et pectoraux.", sets:"3 x 8-10", rest:"60 s" },
        { id:"a6", m:["abdos", "epaules"], name:"Mountain climbers rapides", desc:"Position planche haute, genoux vers la poitrine rapidement, dos plat.", sets:"4 x 30 s", rest:"45 s" },
        { id:"a7", m:["dos", "fessiers"], name:"Superman + extension dorsale", desc:"Allongé sur le ventre, lever bras et jambes simultanément, contraction lombaires 2 s en haut.", sets:"3 x 15", rest:"45 s" },
        { id:"a8", m:["fessiers", "jambes"], name:"Pont fessier unilatéral", desc:"Allongé, un pied au sol, pousser le bassin vers le haut en gardant le bassin droit.", sets:"3 x 12/jambe", rest:"45 s" },
        { id:"a9", m:["poitrine", "epaules", "abdos"], name:"Push-up to shoulder tap", desc:"Pompe puis toucher épaule opposée en gainant fort pour éviter la rotation du bassin.", sets:"3 x 10", rest:"60 s" }
      ]
    },
    B: {
      name: "Programme B — Récupération active", met: 3,
      subtitle: "Séance courte, jours de fatigue — RPE 3-4/10",
      location: "Maison",
      duration: "25-30 min",
      warmup: null,
      note: "Ces jours-là, privilégie aussi le sommeil (7-9h) et une douche froide en fin de séance si tu la tolères.",
      exercises: [
        { id:"b1", m:["jambes"], name:"Marche rapide ou elliptique léger", desc:"Allure conversationnelle, respiration nasale si possible.", sets:"10 min", rest:"—" },
        { id:"b2", m:["cou", "epaules"], name:"Rotations articulaires complètes", desc:"Cou, épaules, hanches, genoux, chevilles — mouvements lents et amples.", sets:"5 min", rest:"—" },
        { id:"b3", m:["dos", "abdos"], name:"Chat-vache (mobilité dos)", desc:"À quatre pattes, alterner dos rond / dos creux en respirant.", sets:"10 reps lentes", rest:"20 s" },
        { id:"b4", m:["fessiers", "jambes"], name:"Étirement hanches « 90/90 »", desc:"Assis, une jambe pliée devant à 90°, une derrière à 90°, alterner.", sets:"3 x 30 s/côté", rest:"—" },
        { id:"b5", m:["abdos"], name:"Gainage planche statique (léger)", desc:"Juste pour réactiver la sangle abdominale.", sets:"2 x 20-30 s", rest:"30 s" },
        { id:"b6", m:[], name:"Respiration diaphragmatique", desc:"Allongé, main sur le ventre, inspiration 4 s / expiration 6 s.", sets:"5 min", rest:"—" }
      ]
    },
    C1: {
      name: "Programme C1 — Haut du corps", met: 5,
      subtitle: "Force/Puissance + sac de frappe",
      location: "Salle",
      duration: "60-70 min",
      warmup: null,
      note: "Note sur les tractions/dips : si tu ne réalises pas encore l'exercice complet, utilise le programme de préparation dédié (onglet Programmes → Prépa tractions/dips).",
      exercises: [
        { id:"c1_1", m:["dos", "bras"], sub:"prep_tractions", name:"Tractions (ou variante de préparation)", desc:"Prise pronation, tirer jusqu'au menton, descente contrôlée 3 s.", sets:"4 x 6-10", rest:"90 s" },
        { id:"c1_2", m:["epaules", "bras"], name:"Développé militaire haltères", desc:"Debout ou assis, presse au-dessus de la tête, gainage abdo serré.", sets:"4 x 8-10", rest:"75 s" },
        { id:"c1_3", m:["poitrine", "bras"], sub:"prep_dips", name:"Dips (ou variante de préparation)", desc:"Buste légèrement penché en avant, descente jusqu'à 90° au coude.", sets:"3 x 8-12", rest:"75 s" },
        { id:"c1_4", m:["dos", "bras"], name:"Rowing barre buste penché", desc:"Dos plat, tirer la barre vers le bas du sternum, contraction omoplates.", sets:"4 x 10", rest:"75 s" },
        { id:"c1_5", m:["epaules", "bras", "abdos"], name:"Sac — combinaisons puissance", desc:"1-2 (jab-cross) avec rotation de hanche complète, frappes maximales techniques.", sets:"6 x 15-20 s", rest:"40 s" },
        { id:"c1_6", m:["bras"], name:"Curl + extension triceps (superset)", desc:"Curl strict puis extension triceps au-dessus de la tête.", sets:"3 x 12 (chaque)", rest:"60 s" },
        { id:"c1_7", m:["abdos"], name:"Gainage suspendu (leg raise)", desc:"Jambes tendues levées jusqu'à l'horizontale, contrôle de la descente.", sets:"3 x 10-15", rest:"60 s" }
      ]
    },
    C2: {
      name: "Programme C2 — Bas du corps", met: 5.5,
      subtitle: "Force/Puissance + tirage",
      location: "Salle",
      duration: "60-70 min",
      warmup: null,
      note: "Ton matériel (barre droite + curl bar + petites plaques + haltères ajustables) limite la charge max. Travaille en volume (plus de reps, tempo lent, séries rapprochées) tant que tu n'as pas plus de plaques.",
      exercises: [
        { id:"c2_1", m:["jambes", "fessiers"], name:"Squat barre (front/back)", desc:"Pieds largeur épaules, descente contrôlée, dos plat.", sets:"4 x 8-10", rest:"90 s" },
        { id:"c2_2", m:["fessiers", "jambes", "dos"], name:"Soulevé de terre roumain", desc:"Jambes quasi tendues, hanches en arrière, barre proche des tibias.", sets:"4 x 8-10", rest:"90 s" },
        { id:"c2_3", m:["jambes", "fessiers"], name:"Fentes bulgares", desc:"Pied arrière sur le banc, descente à 90° genou avant.", sets:"3 x 10/jambe", rest:"75 s" },
        { id:"c2_4", m:["jambes", "mollets"], name:"Squat sauté avec lest léger", desc:"Explosivité max à la réception, contrôle souple.", sets:"4 x 8", rest:"90 s" },
        { id:"c2_5", m:["mollets"], name:"Mollets debout", desc:"Amplitude complète, pause 1 s en haut.", sets:"3 x 15-20", rest:"45 s" },
        { id:"c2_6", m:["dos", "bras"], name:"Rowing unilatéral haltère", desc:"Buste penché, tirage vers la hanche, contraction omoplate.", sets:"3 x 12/côté", rest:"60 s" },
        { id:"c2_7", m:["abdos"], name:"Gainage anti-rotation", desc:"Planche, ramener genou vers coude opposé, bassin stable.", sets:"3 x 10/côté", rest:"45 s" }
      ]
    },
    D: {
      name: "Programme D — Conditionnement / cardio combat", met: 9, roundsConfigurable: true,
      subtitle: "Efforts intermittents intenses + frappe",
      location: "Salle",
      duration: "45-55 min",
      warmup: "Elliptique allure modérée — 5 min",
      note: "Progression : ajoute un round toutes les 2-3 semaines (max 8 rounds), ou réduis le repos de 60 s → 45 s → 30 s avant d'ajouter un round.",
      exercises: [
        { id:"d1", m:["epaules", "bras", "abdos"], name:"Round 1 — Sac, combinaisons libres", desc:"Technique propre, rythme soutenu.", sets:"3 min effort", rest:"1 min" },
        { id:"d2", m:["jambes", "abdos", "epaules"], name:"Round 2 — Burpees + squats sautés", desc:"En alternance.", sets:"3 min effort", rest:"1 min" },
        { id:"d3", m:["epaules", "bras"], name:"Round 3 — Sac, frappes puissance max", desc:"5 frappes max + repos court, répété.", sets:"3 min effort", rest:"1 min" },
        { id:"d4", m:["mollets", "jambes"], name:"Round 4 — Corde à sauter / montées de genoux", desc:"Rythme rapide.", sets:"3 min effort", rest:"1 min" },
        { id:"d5", m:["epaules", "bras"], name:"Round 5 — Sac, endurance", desc:"Rythme modéré continu, technique propre.", sets:"3 min effort", rest:"1 min" }
      ],
      cooldown: "Elliptique allure très légère + respiration — 5 min"
    },
    E: {
      name: "Programme E — Haute intensité", met: 11,
      subtitle: "Jours « à fond » — 1x/semaine max, remplace C ou D",
      location: "Salle",
      duration: "30-40 min",
      warmup: "8-10 min renforcé : elliptique 3 min, mobilité articulaire complète, 10 squats sautés légers, 10 pompes, montées de genoux 1 min.",
      note: "Circuit en 4 tours, repos minimal entre exercices, 2-3 min entre les tours. Ne s'ajoute jamais en plus du volume habituel — remplace une séance C ou D.",
      exercises: [
        { id:"e1", m:["jambes", "fessiers", "mollets"], name:"Squats sautés avec haltères légers", desc:"Explosivité maximale à chaque répétition, réception souple.", sets:"45 s effort max", rest:"15 s" },
        { id:"e2", m:["epaules", "bras"], name:"Sac — combinaisons puissance maximale", desc:"Enchaînements rapides et puissants, technique propre malgré la fatigue.", sets:"45 s effort max", rest:"15 s" },
        { id:"e3", m:["dos", "bras", "poitrine"], name:"Tractions + dips enchaînés", desc:"Le plus de répétitions possible en gardant l'amplitude complète.", sets:"45 s effort max", rest:"15 s" },
        { id:"e4", m:["abdos", "jambes", "epaules"], name:"Burpees complets avec saut", desc:"Pompe + saut groupé + saut vertical, rythme maximal soutenable.", sets:"45 s effort max", rest:"15 s" },
        { id:"e5", m:["fessiers", "dos", "jambes"], name:"Soulevé de terre roumain explosif", desc:"Charge modérée, extension de hanche rapide et puissante.", sets:"45 s effort max", rest:"15 s" },
        { id:"e6", m:["abdos"], name:"Mountain climbers sprint", desc:"Rythme le plus rapide possible en gardant le dos plat.", sets:"45 s effort max", rest:"15 s" }
      ],
      finisher: "Optionnel (si énergie restante) : 2 min non-stop sur le sac à intensité maximale, technique la plus propre possible.",
      safety: [
        "Jamais après une nuit courte (< 6h) ou courbatures importantes restantes.",
        "À la moindre sensation de vertige, douleur articulaire aiguë ou technique qui se dégrade fortement : arrête le tour en cours.",
        "Hydratation renforcée avant/pendant/après — boisson électrolytes recommandée.",
        "Répète le circuit 4 fois. Objectif de progression : maintenir le même nombre de reps au tour 4 qu'au tour 1, avant d'augmenter charge ou temps d'effort (45 s → 50 s → 60 s)."
      ]
    },
    prep_tractions: {
      name: "Prépa tractions", met: 5,
      subtitle: "2-3x/semaine — jusqu'à intégrer la traction complète en C1",
      location: "Salle",
      duration: "15-20 min",
      warmup: null,
      note: "Progression : suspension passive → tirage isométrique → rows australiens → tractions négatives → traction complète assistée → traction complète. Teste une traction complète toutes les 2-3 semaines.",
      exercises: [
        { id:"pt1", m:["dos", "bras"], name:"Rows australiens", desc:"Corps incliné, talons au sol, tirer la poitrine vers la barre — plus horizontal = plus dur.", sets:"4 x 8-12", rest:"60 s" },
        { id:"pt2", m:["dos", "bras"], name:"Tractions négatives", desc:"Monte sur un step/banc, menton au-dessus de la barre, descends le plus lentement possible (5-8 s).", sets:"4 x 5-6", rest:"90 s" },
        { id:"pt3", m:["dos", "bras"], name:"Tirage vertical isométrique (suspension active)", desc:"Suspendu, tirer les épaules vers le bas sans plier les coudes, tenir la position.", sets:"4 x 10-15 s", rest:"60 s" },
        { id:"pt4", m:["dos", "bras"], name:"Suspension passive à la barre", desc:"Bras tendus, tenir le plus longtemps possible.", sets:"3 x max", rest:"60 s" },
        { id:"pt5", m:["dos", "bras"], name:"Tirage horizontal serré", desc:"Barre + curl bar, prise mains rapprochées, tirer vers le bas du sternum.", sets:"4 x 10", rest:"75 s" }
      ]
    },
    prep_dips: {
      name: "Prépa dips", met: 5,
      subtitle: "2-3x/semaine — retirer l'aide progressivement",
      location: "Salle",
      duration: "15 min",
      warmup: null,
      note: "Progression : dips sur banc → dips négatifs → dips assistés (un pied au sol, de plus en plus léger) → dip complet. Ne brûle pas les étapes.",
      exercises: [
        { id:"pd1", m:["poitrine", "bras"], name:"Dips sur banc (pieds au sol, jambes fléchies)", desc:"Mains sur le bord du banc derrière toi, jambes fléchies pour réduire la charge.", sets:"4 x 10-15", rest:"60 s" },
        { id:"pd2", m:["poitrine", "bras"], name:"Dips négatifs", desc:"Monte en position haute (aide des jambes si besoin), descends le plus lentement possible (5-8 s).", sets:"4 x 5-6", rest:"90 s" },
        { id:"pd3", m:["poitrine", "bras"], name:"Dips assistés (un pied au sol)", desc:"Garder un pied au sol pour retirer une partie du poids, retirer l'aide progressivement.", sets:"3 x 8-10", rest:"75 s" },
        { id:"pd4", m:["poitrine", "bras"], name:"Pompes serrées", desc:"Mains rapprochées sous le sternum, coudes proches du corps.", sets:"3 x 10-12", rest:"60 s" }
      ]
    },
    points_faibles: {
      name: "Points faibles — Grip / Abdos / Cou / Poignets & tibias", met: 4.5,
      subtitle: "Séance ciblée sur tes points faibles — 2x/semaine en complément",
      location: "Salle ou Maison",
      duration: "50-60 min",
      warmup: null,
      note: "Regroupe tout ce qui était avant dispersé (cou, préhension, poignets/tibias) avec un vrai bloc abdos/gainage. À ajouter en complément d'une séance principale, pas à la place. Séance longue : si le temps manque, fais un bloc par jour plutôt que tout d'un coup.",
      exercises: [
        { id:"rf_cou1", category:"Cou", m:["cou"], name:"Flexion/extension cou (résistance manuelle)", desc:"Mains derrière la tête, pousser vers l'arrière contre résistance, puis l'inverse vers l'avant.", sets:"3 x 10 (chaque sens)", rest:"3-4 s/rep" },
        { id:"rf_cou2", category:"Cou", m:["cou"], name:"Flexion latérale (résistance manuelle)", desc:"Une main sur le côté de la tête, pousser latéralement contre résistance.", sets:"3 x 10/côté", rest:"—" },
        { id:"rf_cou3", category:"Cou", m:["cou"], name:"Pont de tête avant (progressif)", desc:"Allongé sur le dos, soulever légèrement la tête, épaules au sol, contraction isométrique.", sets:"3 x 15-20 s", rest:"—" },
        { id:"rf_cou4", category:"Cou", m:["cou"], name:"Pont de tête arrière (très progressif)", desc:"À quatre pattes puis poser le sommet du crâne, transférer doucement le poids — jamais en charge complète au début.", sets:"2 x 10-15 s", rest:"—" },
        { id:"rf_cou5", category:"Cou", m:["cou"], name:"Rotations contrôlées (résistance manuelle)", desc:"Main sur la joue, tourner la tête contre résistance légère.", sets:"3 x 8/côté", rest:"—" },

        { id:"rf_grip1", category:"Grip", m:["avant_bras","dos"], name:"Suspension à la barre (dead hang)", desc:"Suspendu bras tendus à la barre de traction, épaules légèrement engagées, tenir le plus longtemps possible.", sets:"3 x max", rest:"90 s" },
        { id:"rf_grip2", category:"Grip", m:["avant_bras"], name:"Bobine à poignets (wrist roller)", desc:"Barre courte + corde + poids suspendu, enrouler puis dérouler avec les poignets uniquement.", sets:"3 x 30 s", rest:"60 s" },
        { id:"rf_grip3", category:"Grip", m:["avant_bras","dos","abdos"], name:"Farmer's Carry", desc:"Marche en tenant une charge lourde dans chaque main, dos droit, épaules basses, gainage actif.", sets:"3 x 30-40 m", rest:"60 s" },

        { id:"rf_abs1", category:"Abdos & gainage", m:["abdos"], name:"Hollow Body Hold", desc:"Allongé sur le dos, bas du dos plaqué au sol, bras et jambes tendus légèrement décollés — gainage isométrique complet.", sets:"3 x 20-30 s", rest:"45 s" },
        { id:"rf_abs2", category:"Abdos & gainage", m:["abdos"], name:"Gainage planche + variations latérales", desc:"Planche classique puis planche latérale de chaque côté, corps aligné, pas de creux dans le dos.", sets:"3 x 30-40 s", rest:"45 s" },
        { id:"rf_abs3", category:"Abdos & gainage", m:["abdos"], name:"Crunch + jeté de medicine ball contre mur", desc:"Assis face à un mur solide, position crunch, remonter en explosant et projeter le ballon contre le mur, rattraper le rebond.", sets:"4 x 8-10", rest:"60 s" },
        { id:"rf_abs4", category:"Abdos & gainage", m:["abdos"], name:"Relevé de jambes suspendu", desc:"Suspendu à la barre, buste vertical et gainé, relever les jambes/genoux vers la poitrine de façon contrôlée.", sets:"3 x 10-15", rest:"60 s" },
        { id:"rf_abs5", category:"Abdos & gainage", m:["abdos"], name:"Russian Twist lesté", desc:"Assis, buste penché à 45°, pieds décollés, rotation du buste avec un disque ou un haltère.", sets:"3 x 20 (10/côté)", rest:"45 s" },

        { id:"rf_pj1", category:"Poignets & tibias", m:["avant_bras"], name:"Flexion/extension poignet (haltère léger)", desc:"Avant-bras posé sur le banc/genou, flexion puis extension du poignet.", sets:"3 x 15 (chaque sens)", rest:"—" },
        { id:"rf_pj2", category:"Poignets & tibias", m:["avant_bras"], name:"Rotations poignet (pronation/supination)", desc:"Coude fixe, tourner le poignet comme pour visser/dévisser.", sets:"3 x 12/côté", rest:"—" },
        { id:"rf_pj3", category:"Poignets & tibias", m:["avant_bras","poitrine"], name:"Pompes sur poings (surface souple)", desc:"Pompes classiques, appui sur les poings fermés, progression très lente.", sets:"3 x 8-10", rest:"—" },
        { id:"rf_pj4", category:"Poignets & tibias", m:["jambes"], name:"Roulé de tibia sur rouleau de mousse", desc:"Pression progressive, jamais de douleur aiguë, désensibilisation graduelle.", sets:"2 x 1-2 min/jambe", rest:"—" },
        { id:"rf_pj5", category:"Poignets & tibias", m:["jambes"], name:"Coups de tibia légers sur le sac", desc:"Technique d'abord, puissance ensuite, progression sur plusieurs semaines.", sets:"3 x 10/jambe", rest:"—" },
        { id:"rf_pj6", category:"Poignets & tibias", m:["jambes"], name:"Équilibre unipodal yeux fermés", desc:"Tenir l'équilibre sur une jambe, yeux fermés.", sets:"3 x 30-45 s/jambe", rest:"—" },
        { id:"rf_pj7", category:"Poignets & tibias", m:["mollets","jambes"], name:"Sauts à la corde / jumping jacks", desc:"Réception sur l'avant du pied, genoux souples.", sets:"3 x 1 min", rest:"—" }
      ]
    },
    cardio_flash: {
      name: "Cardio flash", met: 9, roundsConfigurable: true,
      subtitle: "Bloc cardio court à greffer sur n'importe quelle séance",
      location: "Salle ou Maison",
      duration: "10-12 min",
      warmup: null,
      note: "Ajoute ou retire des rounds directement depuis Programmes → Modifier, selon le temps/l'énergie qu'il te reste ce jour-là.",
      exercises: [
        { id:"cf_r1", m:["epaules","bras","abdos"], name:"Round 1 — Sac ou shadow boxing", desc:"Combinaisons libres, rythme soutenu.", sets:"2 min effort", rest:"30 s" },
        { id:"cf_r2", m:["jambes","abdos"], name:"Round 2 — Burpees / corde à sauter", desc:"Cardio pur, rythme maximal soutenable.", sets:"2 min effort", rest:"30 s" },
        { id:"cf_r3", m:["epaules","bras"], name:"Round 3 — Sac, finish", desc:"Dernier round, tout donner, technique propre malgré la fatigue.", sets:"2 min effort", rest:"30 s" }
      ]
    },
    mobilite: {
      name: "Mobilité Grappling / Lutte", met: 3.5,
      subtitle: "En échauffement + routine dédiée 2x/semaine",
      location: "Salle ou Maison",
      duration: "15-20 min",
      warmup: null,
      note: null,
      exercises: [
        { id:"m1", m:["dos", "abdos"], name:"Bridge (pont arrière)", desc:"Pieds et mains au sol, pousser les hanches vers le haut, tête neutre.", sets:"3 x 20-30 s", rest:"—" },
        { id:"m2", m:["abdos", "fessiers"], name:"Shrimping (fuite de hanche)", desc:"Allongé, pousser avec un bras et une jambe pour glisser les hanches en arrière.", sets:"3 x 8/côté", rest:"—" },
        { id:"m3", m:["fessiers", "abdos"], name:"Hip circles (quadrupédie)", desc:"À quatre pattes, lever un genou et décrire un grand cercle complet.", sets:"2 x 8/côté", rest:"—" },
        { id:"m4", m:["jambes", "abdos"], name:"Squat profond + rotation thoracique", desc:"Squat profond, une main au sol, l'autre tendue vers le plafond en tournant le buste.", sets:"2 x 8/côté", rest:"—" },
        { id:"m5", m:["dos", "epaules"], name:"Thread the needle", desc:"Glisser un bras sous le corps, tourner l'épaule vers le sol.", sets:"2 x 8/côté", rest:"—" },
        { id:"m6", m:["cou", "dos"], name:"Roulades avant/arrière contrôlées", desc:"Sur tapis, technique de protection cervicale, menton rentré.", sets:"3 x 4", rest:"—" },
        { id:"m7", m:["jambes", "abdos"], name:"Technical stand-up", desc:"Depuis le sol, se relever en position de garde sans poser les mains inutilement.", sets:"3 x 6", rest:"—" }
      ]
    }
  },

  equipment: [
    { name: "Plaques de poids supplémentaires", why: "10-20 kg de plus minimum — ton matériel actuel limite vite la charge en squat/soulevé de terre ; le premier frein à lever pour la force pure." },
    { name: "Kettlebell", why: "12-16 kg pour commencer — excellent pour la puissance de hanche (swings), la préhension, et le conditionnement type combat." },
    { name: "Bandes élastiques de résistance", why: "Indispensables pour le renforcement du cou en résistance progressive, l'échauffement épaules, et ajouter de la résistance aux pompes/squats." },
    { name: "Tapis de sol épais / tatamis pliables", why: "Pour la sécurité des roulades, du travail au sol (grappling) et protéger le dos en mobilité." },
    { name: "Gants de boxe + bandages", why: "Pour protéger tes mains/poignets sur le sac, indispensable avant d'augmenter l'intensité des frappes." },
    { name: "Corde à sauter", why: "Peu coûteux, excellent pour le cardio combat et la coordination pieds." },
    { name: "Roller en mousse (foam roller)", why: "Pour la récupération musculaire et le travail tibia." },
    { name: "Sangles de suspension type TRX", why: "Pour varier les exercices de gainage et de tirage à la maison." },
    { name: "Casque + protège-dents", why: "Si tu commences le sparring — pertinent pour ton objectif global en MMA/Muay Thaï." }
  ],

  safety: [
    "Échauffement systématique 5-7 min avant chaque séance, retour au calme 5 min après.",
    "Hydratation : vise 3-4 L/jour vu ton poids de corps et le volume de transpiration en sport de combat.",
    "Sommeil : 7-9h, c'est le facteur n°1 de récupération et de perte de gras à ton niveau.",
    "Semaine de décharge toutes les 4 semaines.",
    "Si douleur articulaire aiguë (différente d'une simple fatigue musculaire) : stop immédiat, repos, avis médical si ça persiste plus de 48-72h.",
    "Le travail cou/poignets/tibias doit progresser sur plusieurs mois, pas en quelques semaines."
  ],

  supplements: [
    { id:"sup_creatine", name:"Créatine monohydrate", dose:"5 g/jour", timing:"N'importe quand, tous les jours (y compris repos)", note:"Le plus utile pour toi — prends-la à heure fixe pour ne pas oublier, peu importe laquelle." },
    { id:"sup_omega3", name:"Oméga-3", dose:"1-2 g/jour", timing:"Avec un repas (contient des graisses)", note:"Anti-inflammatoire, récupération articulaire." },
    { id:"sup_vitd", name:"Vitamine D", dose:"Selon dosage du produit", timing:"Avec un repas", note:"Encore plus utile en hiver / si peu d'exposition au soleil." },
    { id:"sup_electro", name:"Électrolytes (Aptonia Tabs)", dose:"1 tablette dissoute", timing:"Pendant/après les séances intenses (grappling, Muay Thaï)", note:"Seulement les jours de grosse transpiration — pas systématique." },
    { id:"sup_mag", name:"Magnésium (bisglycinate/citrate)", dose:"Selon dosage du produit", timing:"Le soir", note:"Si crampes ou sommeil difficile." }
  ]
};

export const PROGRAM_ORDER = ["A","B","C1","C2","D","E","points_faibles","prep_tractions","prep_dips","cardio_flash","mobilite"];
export const MAIN_PROGRAM_ORDER = ["A","B","C1","C2","D","E","points_faibles"];
export const SUB_PROGRAM_KEYS = ["prep_tractions","prep_dips","cardio_flash","mobilite"];

// Groupes musculaires suivis pour le suivi de régularité (section "Corps")
export const MUSCLE_GROUPS = ["cou","epaules","poitrine","dos","bras","avant_bras","abdos","fessiers","jambes","mollets"];
export const MUSCLE_LABELS = {
  cou: "Cou", epaules: "Épaules", poitrine: "Poitrine", dos: "Dos", bras: "Bras",
  avant_bras: "Avant-bras", abdos: "Abdos", fessiers: "Fessiers/Ischios", jambes: "Jambes", mollets: "Mollets"
};
// Zones visibles sur la silhouette de face (les autres restent suivies mais listées sous le schéma)
export const MUSCLE_ON_DIAGRAM = ["cou","epaules","poitrine","bras","avant_bras","abdos","jambes","mollets"];
