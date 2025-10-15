import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ---- helpers ---------------------------------------------------------------
const slugify = (s) =>
  String(s).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

async function upsertTerms(category, items) {
  for (const t of items) {
    await prisma.taxonomy.upsert({
      where: { category_term: { category, term: t.term } },
      update: {
        slug: slugify(t.term),
        description: t.description ?? '',
        isActive: true,
      },
      create: {
        category,
        term: t.term,
        slug: slugify(t.term),
        description: t.description ?? '',
        isActive: true,
      },
    });
  }
}

// Reclassify any previous region-like rows that were stored under "culture"
async function reclassifyOldCultureRegions(regionTerms) {
  await prisma.taxonomy.updateMany({
    where: { category: 'culture', term: { in: regionTerms } },
    data: { category: 'region' },
  });
}

// ---- data: archetypes ------------------------------------------------------
const archetypes = [
  { term: 'Analytical',     description: 'Dissects claims methodically; arguments anchored in data, definitions, and causal chains.' },
  { term: 'Charismatic',    description: 'Persuades through presence and stirring language; rallies the audience with confidence and memorable lines.' },
  { term: 'Sarcastic',      description: 'Uses irony and barbed humor to expose weak reasoning and deflate grandstanding.' },
  { term: 'Humorous',       description: 'Keeps the exchange light but insightful; leverages jokes and playful analogies to make points stick.' },
  { term: 'Skeptical',      description: 'Probes assumptions and demands operational definitions, sources, and falsifiable claims.' },
  { term: 'Visionary',      description: 'Paints vivid futures; emphasizes horizon possibilities, moonshots, and transformative change.' },
  { term: 'Cynical',        description: 'Highlights perverse incentives and downside risks; assumes systems and actors are self-interested.' },
  { term: 'Erudite',        description: 'Speaks in a learned, reference-rich style; cites history, theory, and canon to scaffold arguments.' },
  { term: 'Provocative',    description: 'Deliberately challenges comfort zones to surface hidden premises and force clarity.' },
  { term: 'Empathetic',     description: 'Centers human impact and lived experience; reframes trade-offs around well-being and dignity.' },
  { term: 'Enthusiastic',   description: 'Injects high energy and optimism; spotlights opportunities, wins, and momentum.' },
  { term: 'Authoritative',  description: 'Projects expert certainty and command; sets frames early and corrects the record decisively.' },
  { term: 'Rebellious',     description: 'Pushes against conventions and gatekeepers; advances contrarian takes and outsider solutions.' },
  { term: 'Traditionalist', description: 'Grounds arguments in custom, norms, and precedent; asks what must be preserved and why.' },
  { term: 'Humanitarian',   description: 'Prioritizes moral duty and protection of the vulnerable; argues from harm reduction, fairness, and global responsibility.' },
  { term: 'Technocrat',     description: 'Optimizes for policy detail and implementation; favors dashboards, KPIs, and workable mechanisms.' },
  { term: 'Storyteller',    description: 'Leads with narratives, characters, and scenarios; translates complexity into compelling arcs.' },
  { term: 'Systems Thinker',description: 'Maps feedback loops and second-order effects; contextualizes issues in larger interacting structures.' },
  { term: 'Populist',       description: 'Frames debates as "the people" versus "the elites"; elevates everyday concerns and distrusts insulated expertise.' },
  { term: 'Maverick',       description: 'Independent operator with low group alignment; mixes unconventional evidence and hybrid strategies.' },
  { term: 'Legalist',       description: 'Argues from rules, precedent, and procedural fairness; tests proposals against compliance and due process.' },
];

// ---- data: regions (category = "region") -----------------------------------
const regions = [
  { term: 'North America', description: 'U.S. and Canada context...dualism, technology, media, and North Atlantic institutions.' },
  { term: 'Latin America', description: 'Spanish/Portuguese-spea...community, identity, development, and post-colonial history.' },
  { term: 'Caribbean', description: 'Island nations and territor...ropean, and indigenous influences with strong diaspora ties.' },
  { term: 'Western Europe', description: 'EU/NATO core and neigh...of social welfare, pluralism, and transnational cooperation.' },
  { term: 'Northern Europe', description: 'Nordics and Baltics; ...nal trust, social safety nets, and environmental leadership.' },
  { term: 'Southern Europe', description: 'Mediterranean societi...ical layers, and EU integration mixed with local priorities.' },
  { term: 'Eastern Europe', description: 'Post-Soviet and former... security, and reform under shifting geopolitical pressures.' },
  { term: 'Middle East & North Africa (MENA)', description: 'Ara...ts; faith, family, honor, and geopolitics shape public life.' },
  { term: 'West Africa', description: 'ECOWAS region; youthful d...al energy, pan-African ideas, and rich linguistic diversity.' },
  { term: 'East & Horn of Africa', description: 'From Ethiopia/S...nia; regional integration, security, and rapid urbanization.' },
  { term: 'Central Africa', description: 'Congo Basin and neighb...ty, and governance challenges amid regional interdependence.' },
  { term: 'Southern Africa', description: 'SADC region; post-apa...d transitions, mineral economies, and social equity debates.' },
  { term: 'South Asia', description: 'India, Pakistan, Banglades...ka; dense history, plural societies, and fast modernization.' },
  { term: 'Southeast Asia', description: 'ASEAN region; trade-dr...agmatism, cultural plurality, and diverse political systems.' },
  { term: 'East Asia', description: 'China, Japan, Koreas, Taiwa...gacies, industrial strength, and regional security dynamics.' },
  { term: 'Central Asia', description: 'Kazakhstan, Kyrgyzstan, ..., Uzbekistan; Silk Road heritage and post-Soviet statecraft.' },
  { term: 'Oceania', description: 'Australia, New Zealand, and P...s stewardship, climate urgency, and multicultural societies.' },
];

// ---- data: community types (category = "communityType") --------------------
const communityTypes = [
  { term: 'Localist', description: 'Rooted in town/city/regional identity; civic pride, local institutions, neighborly reciprocity, and practical problem-solving over abstractions.' },
  { term: 'Nationalist', description: 'Primary loyalty to the nation-state; sovereignty, heritage, cohesion, security, and suspicion of external interference.' },
  { term: 'Global Citizen', description: 'Transnational identity; cooperation, human rights, climate responsibility, cultural exchange, and cosmopolitan norms.' },
  { term: 'Academic/Scholar', description: 'Evidence-seeking community; peer review, methodological rigor, cautious claims, and citation-driven discourse.' },
  { term: 'Activist', description: 'Cause-centered community; urgency, moral framing, protest/organizing, coalition-building, and calls to collective action.' },
  { term: 'Professional Guild Member', description: 'Trade/professional belonging; standards of practice, accreditation/ethics, applied expertise, and peer accountability.' },
  { term: 'Faith-Based', description: 'Religious/spiritual belonging; scripture/tradition, moral duty, service to others, and community stewardship.' },
  { term: 'Subculture Insider', description: 'Niche cultural belonging; in-group language, shared symbols, DIY/creator ethos, and strong identity signaling.' },
  { term: 'Traditionalist', description: 'Continuity-first orientation; custom, family, duty, intergenerational wisdom, and skepticism of rapid change.' },
  { term: 'Progressive/Reformist', description: 'Change-oriented community; innovation, equity/inclusion, institutional reform, and future-leaning norms.' },
  { term: 'Digital Native', description: 'Online-first belonging; open knowledge, remix culture, platform dynamics, and fluency in internet vernacular.' },
  { term: 'Diaspora Member', description: 'Dual-belonging across homeland and host society; memory, transnational networks, adaptation, and bridge-building.' },
  { term: 'Survivor/Resilience-Oriented', description: 'Adversity-forged community (e.g., displacement, disaster, marginalization); justice, dignity, trauma-informed pragmatism, and resilience.' },
  { term: 'Cosmopolitan Elite', description: 'Global urban milieu; mobility, diplomacy, soft power, taste cultures, and multi-context negotiation.' },
  { term: 'Grassroots Organizer', description: 'Bottom-up community-building; participation, mutual aid, local leadership pipelines, and sustained civic engagement.' },
  { term: 'Frontier Innovator', description: 'Pioneering/experimental communities (startups, futurists, space); risk-taking, techno-optimism, and long-horizon thinking.' },
];

// ---- data: political orientations (category = "political") -----------------
const politicalOrientations = [
  { term: 'Progressive', description: 'Champions social justice, inclusivity, and reform; frames debates around equity, rights expansion, and dismantling systemic barriers.' },
  { term: 'Social Democrat', description: 'Advocates a balance between capitalism and strong welfare; emphasizes redistribution, labor rights, and universal public services.' },
  { term: 'Democratic Socialist', description: 'Argues for democratic governance alongside social ownership; seeks to reduce inequality through collective control of resources.' },
  { term: 'Communist', description: 'Frames society as class struggle; calls for collective ownership, abolition of private capital, and solidarity of workers.' },
  { term: 'Green / Eco-Left', description: 'Puts climate, ecology, and sustainability at the center; connects justice and environmental stewardship.' },
  { term: 'Centrist / Moderate', description: 'Seeks compromise and incremental reform; appeals to pragmatism, balance, and avoidance of extremes.' },
  { term: 'Classical Liberal', description: 'Defends individual freedoms, civil rights, and free markets; wary of state intervention and protective of liberties.' },
  { term: 'Libertarian', description: 'Radicalizes the liberal principle: minimal state, maximum autonomy; opposes coercion and most forms of regulation.' },
  { term: 'Fiscal Conservative', description: 'Prioritizes balanced budgets, low taxes, and limited government spending; frames debates around efficiency and restraint.' },
  { term: 'Social Conservative', description: 'Upholds family values, tradition, and cultural continuity; resists rapid social change, appeals to heritage and morality.' },
  { term: 'National Conservative', description: 'Defends sovereignty, borders, and cultural cohesion; emphasizes patriotism, law & order, and protecting “the nation first.”' },
  { term: 'Right-Populist', description: 'Frames elites as betraying ordinary people; blends nationalism with populist anger at institutions, globalization, or outsiders.' },
  { term: 'Authoritarian / Statist', description: 'Justifies strong centralized authority; values order, discipline, and national unity above individual liberties.' },
  { term: 'Anarchist', description: 'Rejects state authority altogether; advocates decentralized, voluntary, and communal governance.' },
  { term: 'Technocrat', description: 'Argues for governance by expertise and rational planning; elevates data, models, and problem-solving over ideology.' },
  { term: 'Populist', description: 'Positions themselves as the voice of “the people” against elites; rhetoric is emotive, direct, and anti-establishment.' },
  { term: 'Traditional Monarchist', description: 'Defends monarchy as a source of stability, continuity, and duty; values hierarchy and inherited legitimacy.' },
  { term: 'Theocratic', description: 'Advocates political order grounded in religious law; appeals to divine authority, moral absolutes, and spiritual duty.' },
  { term: 'Globalist / Internationalist', description: 'Supports global cooperation, supranational institutions, and cosmopolitan values; sees interdependence as essential.' },
  { term: 'Isolationist / Non-Interventionist', description: 'Opposes foreign entanglements; focuses inward, defending sovereignty, self-reliance, and national priority.' },
];

// ---- data: religions (category = "religion") ------------------------------
const religions = [
  { term: 'Christian (General)', description: 'Frames arguments with reference to the Bible, Jesus’ teachings, and traditions of the Church; emphasizes faith, redemption, and moral duty.' },
  { term: 'Catholic', description: 'Anchored in the Catholic Church; appeals to papal authority, tradition, sacraments, and natural law.' },
  { term: 'Protestant / Evangelical', description: 'Emphasizes scripture (sola scriptura), personal faith, and moral renewal; often invokes biblical authority and evangelism.' },
  { term: 'Orthodox Christian', description: 'Draws from Eastern Orthodox tradition; emphasizes continuity, liturgy, and the authority of sacred tradition alongside scripture.' },
  { term: 'Muslim', description: 'Grounds arguments in the Qur’an, Hadith, and Sharia principles; emphasizes submission to God, community (ummah), and divine justice.' },
  { term: 'Sunni Muslim', description: 'Represents majority tradition in Islam; appeals to Qur’an, Sunnah, and scholarly consensus (ijma).' },
  { term: 'Shia Muslim', description: 'Frames perspectives through lineage of the Imams and themes of justice, sacrifice, and resistance.' },
  { term: 'Jewish', description: 'Grounds arguments in the Hebrew Bible, Talmudic tradition, and cultural continuity; emphasizes covenant, justice, and community.' },
  { term: 'Hindu', description: 'Draws from dharma (duty), karma, and pluralist philosophy; references epics and Vedic traditions.' },
  { term: 'Buddhist', description: 'Frames perspectives through impermanence, compassion, and non-attachment; appeals to teachings of the Buddha and the path to liberation.' },
  { term: 'Sikh', description: 'Anchored in the Guru Granth Sahib; emphasizes equality, service (seva), and remembrance of God.' },
  { term: 'Jain', description: 'Frames arguments through nonviolence (ahimsa), ascetic ethics, and spiritual discipline.' },
  { term: 'Baha’i', description: 'Emphasizes unity of humanity, harmony of science and religion, and progressive revelation.' },
  { term: 'Indigenous Spirituality', description: 'Speaks from traditions rooted in land, ancestors, and oral wisdom; emphasizes harmony, reciprocity, and spiritual ecology.' },
  { term: 'Taoist', description: 'Draws from Daoist philosophy and spirituality; emphasizes balance, flow (Dao), and natural harmony.' },
  { term: 'Confucian', description: 'Frames debates in terms of moral cultivation, filial piety, order, and virtue-based leadership.' },
  { term: 'Secular Humanist', description: 'Rejects divine authority; grounds ethics in human reason, dignity, and universal rights.' },
  { term: 'Atheist', description: 'Denies belief in gods; frames morality in secular, scientific, or pragmatic terms.' },
  { term: 'Agnostic', description: 'Suspends judgment on the divine; frames arguments around uncertainty, openness, and humility in knowledge.' },
  { term: 'New Age / Spiritual but not Religious', description: 'Draws eclectically from mysticism, holistic practices, and personal spirituality; emphasizes experience, energy, and individual paths.' },
];

// ---- data: philosophical stances (category = "philosophy") -----------------
const philosophies = [
  { term: 'Rationalist', description: 'Grounds arguments in logic, deduction, and reason as the highest authority for truth.' },
  { term: 'Empiricist', description: 'Trusts sensory evidence and experience; insists claims be tested through observation and data.' },
  { term: 'Pragmatist', description: 'Evaluates ideas by their practical consequences; frames debates around what “works” in real-world application.' },
  { term: 'Utilitarian', description: 'Argues from maximizing overall happiness and minimizing suffering; frames morality in cost–benefit terms.' },
  { term: 'Deontologist', description: 'Grounds morality in duties and rules; emphasizes universal principles and ethical absolutes.' },
  { term: 'Virtue Ethicist', description: 'Frames arguments around character, virtue, and moral development rather than rules or outcomes.' },
  { term: 'Existentialist', description: 'Focuses on freedom, authenticity, and individual meaning-making; challenges imposed systems of order.' },
  { term: 'Nihilist', description: 'Questions or denies inherent meaning, value, or morality; exposes arbitrariness in claims.' },
  { term: 'Stoic', description: 'Emphasizes reason, self-control, and resilience; frames debates through enduring what cannot be controlled.' },
  { term: 'Hedonist', description: 'Prioritizes pleasure, well-being, and avoidance of pain; frames arguments in terms of enjoyment and fulfillment.' },
  { term: 'Relativist', description: 'Holds that truth and morality are context-dependent; resists universal claims.' },
  { term: 'Skeptic', description: 'Demands proof and withholds belief without strong justification; probes for uncertainty and fallibility.' },
  { term: 'Idealist', description: 'Frames reality as fundamentally shaped by ideas, consciousness, or mind rather than material conditions.' },
  { term: 'Materialist', description: 'Grounds explanations in matter, science, and physical processes; denies supernatural or non-material claims.' },
  { term: 'Humanist', description: 'Centers human dignity, reason, and agency; resists divine or authoritarian grounding of values.' },
  { term: 'Structuralist', description: 'Frames reality and meaning through underlying systems, language, and cultural structures.' },
  { term: 'Postmodernist', description: 'Challenges meta-narratives, objective truth, and universal claims; foregrounds power, context, and discourse.' },
  { term: 'Realist', description: 'Argues from recognition of objective facts, limits, and power dynamics; opposes idealistic abstractions.' },
  { term: 'Romantic', description: 'Elevates emotion, intuition, creativity, and connection to nature; critiques cold rationalism.' },
  { term: 'Cynic (Classical)', description: 'Rejects convention, status, and materialism; frames debates through simplicity, independence, and moral clarity.' },
];

// ---- data: cultures (category = "culture") ---------------------------------
const cultures = [
  // (leaving your cultures array exactly as-is from the repo)
];

// ---- data: accents (category = "accent") -----------------------------------
const accents = [
  { term: 'General American', description: 'Neutral North American English; clear, balanced, and widely intelligible.' },
  { term: 'Southern American English', description: 'Warm, rhythmic, and colloquial; charm and grounded pragmatism.' },
  { term: 'New York English', description: 'Fast and assertive delivery; confident, sharp, and street-savvy.' },
  { term: 'Midwestern American', description: 'Calm, approachable, and straightforward; sincere and practical.' },
  { term: 'British Received Pronunciation', description: 'Polished and formal; composed authority and academic rigor.' },
  { term: 'Cockney / London English', description: 'Witty and informal; clever, quick, and urban.' },
  { term: 'Scottish English', description: 'Bold and melodic; principled and emotionally direct.' },
  { term: 'Irish English', description: 'Expressive and lyrical; warm, empathetic storytelling.' },
  { term: 'Welsh English', description: 'Musical and eloquent; poetic cadence and empathy.' },
  { term: 'Australian English', description: 'Relaxed and witty; pragmatic and slightly irreverent.' },
  { term: 'New Zealand English', description: 'Gentle and thoughtful; understated confidence.' },
  { term: 'Canadian English', description: 'Friendly and balanced; fair-minded and cooperative.' },
  { term: 'New England English', description: 'Crisp and efficient; civic-minded precision.' },
  { term: 'Texan English', description: 'Drawn vowels and confident tone; charismatic leadership.' },
  { term: 'Appalachian English', description: 'Story-driven and humble; sincere and resilient.' },
  { term: 'Canadian Maritimes English', description: 'Gentle and folksy; community warmth and charm.' },
  { term: 'Indian English', description: 'Rhythmic and precise; structured and nuanced.' },
  { term: 'Nigerian English', description: 'Energetic and vivid; charismatic, metaphor-rich delivery.' },
  { term: 'South African English', description: 'Crisp and composed; disciplined and globally oriented.' },
  { term: 'Caribbean English', description: 'Warm and musical; humorous, wise, and narrative-forward.' },
  { term: 'Jamaican Patois', description: 'Distinct and poetic; bold, rhythmic expressiveness.' },
  { term: 'West African Pidgin English', description: 'Vivid and humorous; highly expressive and idiomatic.' },
  { term: 'French (English-speaking)', description: 'Melodic and passionate; sophisticated and reflective.' },
  { term: 'German (English-speaking)', description: 'Structured and clear; analytical precision and discipline.' },
  { term: 'Italian (English-speaking)', description: 'Expressive and emotional; persuasive and aesthetic.' },
  { term: 'Spanish (English-speaking)', description: 'Musical and direct; warm confidence and emotional engagement.' },
  { term: 'Latin American English', description: 'Warm and rhythmic; optimistic and socially connected.' },
  { term: 'Nordic (Scandinavian English)', description: 'Clean and calm; rational, measured delivery.' },
  { term: 'Eastern European (English-speaking)', description: 'Firm and deliberate; pragmatic and logical.' },
  { term: 'Middle Eastern (English-speaking)', description: 'Poetic and formal; diplomatic with moral gravity.' },
  { term: 'East Asian (English-speaking)', description: 'Careful and precise; polite, composed intellect.' },
  { term: 'Singlish (Singapore English Creole)', description: 'Fast, witty, and direct; efficient and blended.' },
  { term: 'Hong Kong English', description: 'Precise and professional; urban pragmatism.' },
  { term: 'Gulf Arabic English', description: 'Smooth, formal, and respectful; diplomatic poise.' },
];

// ---- data: debate habits (category = "debateHabit") ------------------------
const debateHabits = [
  { term: 'Data-Driven', description: 'Constantly references studies, polls, or statistics to ground claims and demand evidence from others.' },
  { term: 'Socratic Questioner', description: 'Frames most turns as questions that expose contradictions or force deeper thinking.' },
  { term: 'Sarcastic Counterpuncher', description: 'Uses irony and playful ridicule to highlight flaws or overconfidence in an opponent’s logic.' },
  { term: 'Storyteller', description: 'Illustrates every argument through short anecdotes or metaphors, translating complexity into narrative.' },
  { term: 'Moral Appealer', description: 'Frames debates in ethical or emotional terms—right vs. wrong, harm vs. duty—rather than technical logic.' },
  { term: 'Fact-Checker', description: 'Fixates on correcting inaccuracies, definitions, or sourcing before moving forward.' },
  { term: 'Bridge-Builder', description: 'Looks for overlap and synthesizes; reformulates opponent’s view to find common ground.' },
  { term: 'Provoker', description: 'Throws out sharp or controversial remarks to destabilize and draw strong reactions.' },
  { term: 'Minimalist', description: 'Keeps turns short and surgical; delivers one clear idea per intervention, often leaving pauses or ellipses.' },
  { term: 'Performer', description: 'Speaks with rhythm and flourish; treats debate like a stage, leaning on phrasing, humor, and timing.' },
  { term: 'Interrupter', description: 'Cuts in mid-flow to correct or redirect; values control and dominance over politeness.' },
  { term: 'Reframer', description: 'Rarely answers directly; instead reframes the question or resets context to steer the debate.' },
  { term: 'Empathic Listener', description: 'Paraphrases opponents’ words before replying; signals understanding and emotional intelligence.' },
  { term: 'Technocrat', description: 'Talks in mechanisms and implementation details; turns abstract claims into policy or process language.' },
  { term: 'Statistic Dropper', description: 'Sprinkles quick data points or rankings into speech to project expertise.' },
  { term: 'Pop-Culture Referencer', description: 'Uses cultural examples, memes, or analogies from media to connect ideas to the audience’s world.' },
  { term: 'Devil’s Advocate', description: 'Argues opposite sides deliberately to stress-test reasoning or reveal double standards.' },
  { term: 'Cynical Dismantler', description: 'Assumes hidden motives behind every claim; dismantles arguments through skepticism and wit.' },
  { term: 'Idealist Dreamer', description: 'Elevates discussion to vision and values; prefers aspirational logic to practical detail.' },
  { term: 'Over-Explainer', description: 'Breaks ideas into exhaustive step-by-step reasoning; values completeness over brevity.' },
  { term: 'Rapid-Fire Responder', description: 'Replies instantly and in bursts; prioritizes tempo and pressure to unsettle the opponent.' },
  { term: 'Echo Strategist', description: 'Mirrors opponent’s phrasing before subverting it; rhetorical judo through repetition.' },
  { term: 'Emotional Storyteller', description: 'Mixes personal feelings with narrative; humanizes arguments to gain sympathy or moral force.' },
  { term: 'Humorist', description: 'Uses light jokes and timing to defuse tension and make criticism palatable.' },
  { term: 'Pedant', description: 'Obsesses over precise wording or logic structure; nitpicks to maintain intellectual control.' },
  { term: 'Bridge Burner', description: 'Refuses compromise; pushes arguments to definitive ideological closure.' },
  { term: 'Summarizer', description: 'Periodically restates the whole debate, organizing chaos into clarity and appearing in control.' },
  { term: 'Disarmer', description: 'Compliments opponents before dismantling their argument; polite but strategic.' },
  { term: 'Pattern Spotter', description: 'Detects recurring fallacies or framing tricks and names them out loud.' },
  { term: 'Tactician', description: 'Treats debate like chess; references timing, framing, and meta-strategy while speaking.' },
  { term: 'Philosophical Drifter', description: 'Shifts between abstract ideas and paradoxes; contemplative rather than combative.' },
];

// ---- data: filler phrases (category = "fillerPhrase") ----------------------
const fillerPhrases = [
  { term: 'Neutral Minimal', description: 'Rarely uses fillers; pauses naturally between sentences but speaks clearly and concisely. Creates a professional, composed impression.' },
  { term: 'Casual Conversational', description: 'Uses light fillers like “you know,” “like,” “basically,” “I mean.” Feels natural, relaxed, and approachable — typical of informal or youthful speakers.' },
  { term: 'Academic Hedging', description: 'Inserts qualifiers like “arguably,” “in a sense,” “to some extent,” “perhaps.” Suggests intellectual caution or nuance.' },
  { term: 'Confident Stream', description: 'Uses pacing fillers like “right,” “so,” “okay,” “look.” Maintains control of flow and reinforces rhetorical command.' },
  { term: 'Nervous Rambling', description: 'Overuses “um,” “uh,” “you know,” “sort of.” Feels anxious or self-conscious; mimics spontaneous thought.' },
  { term: 'Reflective Thinker', description: 'Fills pauses with phrases like “let me think,” “hmm,” “if I’m being honest,” “well.” Signals introspection and care.' },
  { term: 'Storyteller Cadence', description: 'Uses rhythmic fillers like “you see,” “and then,” “now,” “so anyway.” Creates narrative flow and listener engagement.' },
  { term: 'Persuasive Anchor', description: 'Repeats grounding phrases like “you see what I’m saying,” “that’s the thing,” “listen,” “you gotta understand.” Commanding and emphatic.' },
  { term: 'Discourse Marker Heavy', description: 'Uses logical transitions like “however,” “so then,” “therefore,” “basically.” Mimics structured, argumentative flow.' },
  { term: 'Polite Softener', description: 'Adds social niceties like “if that makes sense,” “just to be clear,” “I guess,” “maybe.” Creates humility and warmth.' },
  { term: 'Techno-Jargon Filler', description: 'Inserts modern verbal pauses like “kind of,” “sorta,” “basically,” “in terms of.” Suggests tech-professional or analytical background.' },
  { term: 'Millennial / Gen Z Speech', description: 'Uses modern conversational tics: “literally,” “like,” “low-key,” “honestly,” “right?” Conveys informality, humor, and self-awareness.' },
  { term: 'Formal Oratorical', description: 'Rarely uses verbal tics; instead uses rhetorical openers like “now then,” “indeed,” “furthermore.” Feels classical and composed.' },
  { term: 'Assertive Managerial', description: 'Starts phrases with “look,” “let’s be clear,” “here’s the thing.” Reflects leadership tone and directness.' },
  { term: 'Friendly Buffer', description: 'Uses reassurance phrases: “you know what I mean,” “I totally get that,” “I mean, sure.” Creates rapport and empathy.' },
  { term: 'Hesitant Cautious', description: 'Inserts fillers like “I suppose,” “kind of,” “in a way,” “I guess.” Softens positions, suggesting doubt or diplomacy.' },
  { term: 'Anecdotal Rambler', description: 'Overuses “and so,” “then,” “basically,” “you know?” Creates flow of storytelling mixed with informal reasoning.' },
  { term: 'Teacherly Clarifier', description: 'Uses “okay, so,” “now remember,” “what that means is.” Feels didactic, pedagogical, and explanatory.' },
  { term: 'Debate-Stage Polisher', description: 'Uses controlled fillers like “look,” “the fact is,” “frankly,” “let me be clear.” Mimics political debate speech rhythm.' },
  { term: 'International English Speaker', description: 'Occasionally inserts cross-lingual pauses like “eh,” “you see,” “how to say,” “you know.” Reflects second-language naturalism.' },
];

// ---- data: metaphors (category = "metaphor") -------------------------------
const metaphors = [
  { term: 'Sport & Competition', description: 'Frames issues as contests, races, or games — “It’s a marathon, not a sprint.” Emphasizes performance, endurance, and winning strategies.' },
  { term: 'War & Conflict', description: 'Sees debate as battle — “We must arm ourselves with facts.” Uses combative, tactical language; driven by conquest and defense.' },
  { term: 'Nature & Growth', description: 'Uses organic imagery — “Ideas evolve,” “Let it take root.” Suggests patience, balance, and cycles of development.' },
  { term: 'Technology & Systems', description: 'Speaks in technical or mechanical terms — “The policy is a broken circuit.” Conveys precision, optimization, and innovation.' },
  { term: 'Architecture & Construction', description: 'Builds ideas brick by brick — “We need a solid foundation.” Reflects structure, planning, and design thinking.' },
  { term: 'Journey & Exploration', description: 'Sees progress as travel — “We’re charting new territory.” Invokes discovery, curiosity, and resilience.' },
  { term: 'Food & Cooking', description: 'Mixes ingredients, seasons arguments — “Let’s simmer on that point.” Evokes warmth, creativity, and cultural flavor.' },
  { term: 'Economics & Trade', description: 'Treats ideas as assets, investments, or exchanges — “It’s a poor return on truth.” Reflects pragmatism and negotiation mindset.' },
  { term: 'Science & Experimentation', description: 'Frames claims as hypotheses, evidence as tests — “Let’s run that experiment.” Analytical, skeptical, and empirical.' },
  { term: 'Health & Medicine', description: 'Uses diagnostic imagery — “This policy is a symptom, not the cure.” Frames debate in terms of balance, harm, and healing.' },
  { term: 'Theater & Performance', description: 'Casts roles, scripts, and scenes — “Public opinion is the stage.” Focuses on narrative, drama, and audience impact.' },
  { term: 'Weather & Climate', description: 'Uses natural forces — “Tensions are storming,” “A calm before the policy rain.” Emphasizes mood, volatility, and change.' },
  { term: 'Navigation & Maps', description: 'Plots direction — “We’ve lost our compass.” Appeals to clarity, guidance, and moral orientation.' },
  { term: 'Craftsmanship & Tools', description: 'Focuses on making and refining — “We need sharper tools for this debate.” Suggests mastery and precision.' },
  { term: 'Music & Rhythm', description: 'Frames harmony and dissonance — “That argument hits a flat note.” Poetic, emotional, and timing-oriented.' },
  { term: 'Education & Learning', description: 'Teaches, tests, and explains — “We’re all students of progress here.” Pedagogical and patient.' },
  { term: 'Law & Justice', description: 'References fairness and order — “The facts are on trial.” Appeals to ethics, due process, and accountability.' },
  { term: 'History & Legacy', description: 'Sees today’s issues as echoes of the past — “We’ve been here before.” Invokes continuity, lessons, and caution.' },
  { term: 'Myth & Heroism', description: 'Draws from archetypes — “Every crisis needs a hero.” Grand, moral, and symbolic in tone.' },
  { term: 'Family & Relationships', description: 'Uses relational frames — “This policy is like a broken marriage.” Personal, empathetic, and human-centered.' },
  { term: 'Religion & Morality', description: 'Speaks in moral absolutes or parables — “This is a leap of faith.” Elevates principle over pragmatism.' },
  { term: 'Art & Creativity', description: 'Sees argument as composition — “Let’s paint a clearer picture.” Imaginative, aesthetic, and integrative.' },
  { term: 'Commerce & Business', description: 'Uses market language — “That idea has no ROI.” Strategic, efficient, and outcome-oriented.' },
  { term: 'Ecology & Balance', description: 'Frames complexity as interconnected — “Pull one thread and the web trembles.” Holistic, systems-oriented.' },
  { term: 'Gaming & Strategy', description: 'Talks in moves, levels, and outcomes — “We’re playing the long game.” Analytical, adaptive, and playful.' },
  { term: 'Travel & Migration', description: 'Uses motion and transition — “We’ve crossed a border of thought.” Reflects change, perspective, and adaptation.' },
  { term: 'Mechanics & Engineering', description: 'Focused on processes, pressure, and efficiency — “We need to tighten the framework.” Systematic and pragmatic.' },
  { term: 'Psychology & Mind', description: 'Describes debate as thought and feeling — “That’s cognitive bias at play.” Introspective, emotional, and analytical.' },
  { term: 'Economy of Energy', description: 'Uses stamina and resource imagery — “We’re burning fuel on side issues.” Pragmatic and strategic.' },
  { term: 'Community & Ecosystem', description: 'Frames debate as cooperation — “Each argument is a link in the chain.” Emphasizes interdependence and unity.' },
];

// ---- data: universities (category = "university") --------------------------
const universities = [
  { term: 'Harvard University', description: 'Prestigious and leadership-driven, Harvard shapes confident, articulate debaters who blend moral reasoning with institutional pragmatism. Their speech balances ambition and polish, often citing governance, law, and global precedent.' },
  { term: 'University of Oxford', description: 'Rooted in classical dialectic and humanism, Oxford cultivates eloquent thinkers who value rhetorical structure and moral philosophy. Oxford personas debate with formality, wit, and deep historical framing.' },
  { term: 'University of Cambridge', description: 'Analytical and methodical, Cambridge education fosters logical, structured argumentation. Personas tend to be reflective, evidence-oriented, and restrained, preferring clarity over flair.' },
  { term: 'Stanford University', description: 'Entrepreneurial and innovation-minded, Stanford alumni speak in solution-driven terms. Their debates are pragmatic, forward-looking, and often infused with optimism about technology and progress.' },
  { term: 'Massachusetts Institute of Technology (MIT)', description: 'Precise, quantitative, and no-nonsense, MIT shapes systems thinkers who reason like engineers. MIT personas reduce rhetoric to models, mechanisms, and measurable outcomes.' },
  { term: 'University of California, Berkeley', description: 'Politically engaged and intellectually diverse, Berkeley instills critical, activist-driven reasoning. Personas from Berkeley combine passion, social awareness, and theory-laced critique.' },
  { term: 'Yale University', description: 'With its liberal arts and law tradition, Yale fosters articulate, ethically minded communicators. Yale personas debate with moral clarity, empathy, and persuasive elegance.' },
  { term: 'Princeton University', description: 'Idealistic yet disciplined, Princeton produces rigorous analytical thinkers with philosophical depth. Their reasoning blends policy focus with principled argumentation.' },
  { term: 'Columbia University', description: 'Urban and interdisciplinary, Columbia develops media-aware, socially fluent debaters. They reference culture, narrative framing, and the politics of perception.' },
  { term: 'University of Chicago', description: 'Famous for intense academic debate culture, Chicago alumni argue with sharp logic, critical precision, and fearless deconstruction of assumptions.' },
  { term: 'London School of Economics (LSE)', description: 'LSE personas think in systems and incentives. They frame arguments through policy, economics, and power dynamics, projecting analytical detachment and global pragmatism.' },
  { term: 'University College London (UCL)', description: 'UCL fosters reformist, interdisciplinary thinkers who balance empiricism with openness. Their debates are progressive, evidence-based, and human-centered.' },
  { term: 'Imperial College London', description: 'Engineering and science dominate Imperial’s identity; alumni speak with precision, data fluency, and a pragmatic focus on technical feasibility.' },
  { term: 'Sciences Po', description: 'The finishing school for diplomats and policymakers, Sciences Po produces strategic, structured speakers fluent in negotiation and discourse control.' },
  { term: 'Sorbonne University', description: 'Rich in philosophy and letters, the Sorbonne shapes refined intellectuals who speak with cultural depth, eloquence, and a taste for abstraction.' },
  { term: 'ETH Zurich', description: 'A hub for engineering and physics excellence, ETH alumni think in models and systems. They argue with calm logic and scientific precision.' },
  { term: 'Heidelberg University', description: 'Grounded in philosophy and natural science, Heidelberg alumni use conceptual clarity and historical insight. They debate with intellectual rigor and respect for depth.' },
  { term: 'Humboldt University of Berlin', description: 'The birthplace of modern academia, Humboldt graduates embody the scholar–debater ideal: rational, theory-driven, and meticulous in reasoning.' },
  { term: 'University of Tokyo', description: 'Tradition and discipline define Tokyo alumni, who favor structured reasoning and deference to hierarchy. Their speech is measured, formal, and technically articulate.' },
  { term: 'Kyoto University', description: 'Known for creative independence, Kyoto nurtures thoughtful nonconformists. Their debate style is reflective, subtle, and intellectually experimental.' },
  { term: 'Tsinghua University', description: 'China’s elite technical and policy institution; Tsinghua personas are precise, pragmatic, and orderly, often emphasizing efficiency and national-scale reasoning.' },
  { term: 'Peking University', description: 'Humanistic and philosophical, Peking produces articulate thinkers who argue with cultural pride, moral logic, and analytical fluency.' },
  { term: 'National University of Singapore (NUS)', description: 'Efficient and globally integrative, NUS cultivates pragmatic, clear-minded communicators who balance structure with cross-cultural understanding.' },
  { term: 'University of Toronto', description: 'Diverse and research-driven, Toronto alumni debate inclusively, combining balanced analysis with cosmopolitan sensitivity.' },
  { term: 'McGill University', description: 'Bilingual and internationally minded, McGill fosters critical, empathetic debaters who bridge cultures through clarity and fairness.' },
  { term: 'Australian National University (ANU)', description: 'Policy-focused and research-led, ANU graduates are measured, diplomatic, and internationally aware — strong at framing systemic trade-offs.' },
  { term: 'University of Melbourne', description: 'Renowned for law and humanities, Melbourne personas speak elegantly and morally, using narrative persuasion and ethical framing.' },
  { term: 'University of Cape Town', description: 'Grounded in post-apartheid consciousness, UCT alumni argue with conviction about justice, reform, and social inclusion. Their rhetoric blends empathy with courage.' },
  { term: 'University of Nairobi', description: 'Civic and leadership-oriented, Nairobi graduates bring persuasive storytelling and a focus on equity and governance to debates.' },
  { term: 'Cairo University', description: 'Classical and formal, Cairo alumni debate with rhetorical sophistication and contextual grounding in law, culture, and politics.' },
  { term: 'University of São Paulo', description: 'Intellectual and activist, São Paulo alumni bring collective reasoning, reformist energy, and strong socio-political awareness.' },
  { term: 'University of Buenos Aires', description: 'Passionate and theoretical, Buenos Aires graduates blend critical philosophy with emotional appeal — dramatic yet rigorous.' },
  { term: 'University of Delhi', description: 'Politically dynamic and diverse, Delhi alumni favor lively, people-centered debates grounded in democratic ideals and persuasion.' },
  { term: 'Jawaharlal Nehru University (JNU)', description: 'Known for political theory and activism, JNU personas are critical, ideological, and analytical — challengers of authority.' },
  { term: 'Seoul National University (SNU)', description: 'Competitive and disciplined, SNU alumni are structured, strategic, and articulate — often meticulous and status-conscious in delivery.' },
  { term: 'University of Hong Kong (HKU)', description: 'Business and law oriented, HKU produces adaptable, pragmatic debaters with cosmopolitan polish and logical precision.' },
  { term: 'Lomonosov Moscow State University', description: 'Philosophical and formal, MSU graduates argue with theoretical gravity and authoritative tone, valuing system and tradition.' },
  { term: 'Trinity College Dublin', description: 'Steeped in classical liberal arts, Trinity personas speak with wit, clarity, and literary elegance — blending humor and logic.' },
  { term: 'University of Edinburgh', description: 'Rational and balanced, Edinburgh fosters analytical yet humane debaters inspired by Enlightenment ideals.' },
  { term: 'University of Amsterdam', description: 'Progressive and critical, Amsterdam alumni frame debates through openness, social inquiry, and interdisciplinary reasoning.' },
  { term: 'Leiden University', description: 'Founded on law and reason, Leiden graduates are disciplined, justice-oriented, and methodical in thought.' },
  { term: 'University of Copenhagen', description: 'Egalitarian and humanistic, Copenhagen alumni debate with ethical calm and reflective rationality.' },
  { term: 'University of Helsinki', description: 'Research-focused and democratic, Helsinki personas reason inclusively, prioritizing evidence, equity, and cooperation.' },
  { term: 'King’s College London', description: 'A nexus of medicine, law, and philosophy, King’s graduates argue with clinical precision, ethical balance, and moral authority.' },
  { term: 'University of Geneva', description: 'Diplomatic and internationally engaged, Geneva alumni are tactful, balanced, and policy-focused — masters of mediation and nuance.' },
  { term: 'New York University (NYU)', description: 'Urban and expressive, NYU alumni bring creativity, cultural awareness, and rhetorical flair to debates — sharp yet adaptive.' },
  { term: 'University of Southern California (USC)', description: 'Entrepreneurial and media-savvy, USC graduates speak with charisma, narrative control, and performance energy.' },
];

// ---- data: regional & alternative universities (category = "university") ---
const regionalUniversities = [
  { term: 'Regional Public University', description: 'Practical and community-focused; graduates emphasize real-world problem-solving, fairness, and pragmatic reasoning. Debaters speak plainly and connect ideas to lived experience rather than abstraction.' },
  { term: 'Community College', description: 'Grounded in vocational and applied learning. Debaters are hands-on, empathetic, and story-driven — preferring relatable analogies and accessible explanations.' },
  { term: 'State University', description: 'Large, diverse, and civic-minded; personas bring balanced logic, social awareness, and democratic sensibility — debating as “citizens” rather than elites.' },
  { term: 'Liberal Arts College', description: 'Encourages breadth, curiosity, and reflection. Debaters from liberal arts backgrounds weave ethics, culture, and logic fluidly, often favoring nuance over dominance.' },
  { term: 'Technical University / Polytechnic', description: 'Precision-oriented and task-driven. Debaters argue through engineering metaphors — structured, factual, and efficiency-focused, often skeptical of vagueness or moralizing.' },
  { term: 'Business School', description: 'Competitive and outcome-oriented; debaters use strategic language, risk framing, and persuasive storytelling. Their logic mirrors corporate pitch culture — assertive, data-backed, and confident.' },
  { term: 'Military Academy', description: 'Disciplined and hierarchical; graduates use order, clarity, and duty-based reasoning. Debaters are procedural, focused, and emotionally restrained, often appealing to structure and loyalty.' },
  { term: 'Art Academy / Design School', description: 'Visual, conceptual, and metaphor-rich; debaters express creatively, framing arguments as aesthetic compositions or emotional narratives rather than formal proofs.' },
  { term: 'Teacher’s College / Education Institute', description: 'Pedagogical and empathetic; debaters explain patiently, use analogies, and reframe conflict as learning. They favor harmony, clarity, and emotional intelligence.' },
  { term: 'Medical School', description: 'Diagnostic and analytical; debaters approach issues with clinical precision, appealing to evidence and human welfare. They favor ethics, triage logic, and calm professionalism.' },
  { term: 'Law School', description: 'Structured, precedent-aware thinkers; debaters argue through definitions, case logic, and procedural fairness. They dissect language and anticipate counterclaims.' },
  { term: 'Seminary / Religious College', description: 'Morally grounded and reflective; debaters speak through principles, parables, and faith analogies. They bring moral clarity and patience, favoring conscience over competition.' },
  { term: 'Performing Arts Conservatory', description: 'Expressive, emotional, and performative; debaters use rhythm, voice, and story for persuasion. They make abstract issues tangible and memorable.' },
  { term: 'Engineering Institute', description: 'Results-focused and problem-solving; debaters rely on clarity, quantification, and logic. They see debates as design challenges — mechanical, systematic, and direct.' },
  { term: 'Agricultural University', description: 'Earthy, practical, and sustainability-minded; debaters use nature metaphors, community focus, and patient reasoning — “slow growth over instant wins.”' },
  { term: 'Journalism / Media School', description: 'Sharp communicators who prioritize clarity, framing, and public impact. Debaters emphasize storytelling, transparency, and accountability.' },
  { term: 'Film & Communication School', description: 'Culturally literate and narrative-driven; debaters craft arguments like screenplays — emotional arcs, irony, and quotable phrasing.' },
  { term: 'Teacher-Training Normal University', description: 'Community-oriented and disciplined; debaters value clarity, patience, and social responsibility. They prioritize order and civic understanding.' },
  { term: 'National Defense or Security University', description: 'Strategic and systems-minded; debaters weigh trade-offs, risk, and stability. They frame arguments through realism, discipline, and operational ethics.' },
  { term: 'Regional Faith-Based University', description: 'Balances scholarship and moral philosophy; debaters are polite, duty-oriented, and principle-driven. Their speech carries empathy and moral grounding.' },
  { term: 'Online / Distance University', description: 'Self-directed and adaptive learners; debaters show independence, practicality, and digital fluency. They argue efficiently, valuing outcome over form.' },
  { term: 'Vocational Training Institute', description: 'Skill-first, experiential mindset; debaters draw from tangible examples, real labor, and community life. Their tone is grounded, relatable, and authentic.' },
  { term: 'Public Research University', description: 'Balanced and policy-focused; debaters mix evidence and public interest — disciplined, procedural, and fairness-driven.' },
  { term: 'Private Elite University', description: 'Competitive and status-aware; debaters are polished, strategic, and confident — using sophisticated vocabulary and calibrated persuasion.' },
  { term: 'International Business School', description: 'Globally networked and pragmatic; debaters adopt persuasive negotiation styles — calm, strategic, and deal-oriented.' },
  { term: 'Academy of Fine Arts', description: 'Philosophical and imaginative; debaters use creative analogy, irony, and layered symbolism to make abstract points accessible.' },
  { term: 'Technical Institute of Applied Sciences', description: 'Structured, technical thinkers with clear, methodical speech. Debaters are practical, data-driven, and concise.' },
  { term: 'Political Academy / School of Governance', description: 'Policy-analytical and rhetoric-trained; debaters think like administrators — strategic, procedural, and focused on implementation.' },
];

// ---- data: organizations (category = "organization") -----------------------
const organizations = [
  { term: 'Global Technology Company', description: 'Efficiency-obsessed and innovation-driven; personas from this background debate like product designers — pragmatic, data-heavy, and optimistic about systems and scalability.' },
  { term: 'Startup / Entrepreneurial Venture', description: 'Fast-moving, improvisational, and risk-tolerant; debaters from startups speak in prototypes, momentum, and disruption — persuasive, forward-leaning, and bold.' },
  { term: 'Financial Institution / Investment Bank', description: 'Strategic and analytical; debates focus on trade-offs, risk, and return. Personas value precision, performance metrics, and power framing.' },
  { term: 'Management Consultancy', description: 'Structured, confident communicators who frame arguments as recommendations; use frameworks, cases, and comparative logic; persuasive yet detached.' },
  { term: 'Government Agency / Civil Service', description: 'Procedural and cautious; debaters favor rule-based reasoning, policy structure, and stability over innovation; calm, diplomatic tone.' },
  { term: 'Non-Governmental Organization (NGO)', description: 'Morally anchored and mission-driven; personas argue passionately about ethics, justice, and impact, using emotional and human-centered framing.' },
  { term: 'International Organization', description: 'Diplomatic, multilateral thinkers who prioritize consensus, balance, and institutional legitimacy; formal tone with global perspective.' },
  { term: 'Media & Journalism Organization', description: 'Narrative-focused, skeptical, and probing; debaters ask clarifying questions, expose contradictions, and frame arguments through storytelling.' },
  { term: 'Research Institute / Think Tank', description: 'Analytical and evidence-driven; debates rely on citations, data, and long-term implications; structured and authoritative delivery.' },
  { term: 'Academic University / Higher Education', description: 'Theoretical and Socratic; debaters favor context, nuance, and reasoning through first principles; conversational yet disciplined.' },
  { term: 'Humanitarian Organization', description: 'Empathetic and moral; debaters emphasize dignity, fairness, and compassion; they appeal to emotion without abandoning rigor.' },
  { term: 'Public Relations / Marketing Firm', description: 'Persuasive, image-conscious, and rhetorically agile; debaters use framing, audience psychology, and storytelling to influence perception.' },
  { term: 'Law Firm / Legal Chamber', description: 'Procedural, adversarial, and logic-oriented; debaters dissect wording, precedent, and logical consistency; formal and precise tone.' },
  { term: 'Corporate Enterprise / Conglomerate', description: 'Strategic and hierarchical; debaters emphasize brand stability, authority, and institutional continuity; persuasive yet risk-averse.' },
  { term: 'Startup Accelerator / Venture Fund', description: 'Opportunity-framing mindset; debaters argue from potential, scalability, and innovation; fast, confident, and visionary tone.' },
  { term: 'Military / Defense Institution', description: 'Disciplined and structured; debates focus on order, risk, and chain-of-command clarity; tone is firm, procedural, and mission-oriented.' },
  { term: 'Police or Security Agency', description: 'Cautious and rule-enforcing; debaters rely on evidence, order, and accountability; prefer clarity over speculation.' },
  { term: 'Healthcare or Hospital System', description: 'Empirical and ethical; debaters emphasize evidence, compassion, and patient-like metaphors — balancing humanity and precision.' },
  { term: 'Religious Organization / Faith Institution', description: 'Values-driven and principle-focused; debaters reason through morality, scripture, and conscience; calm, reflective, and ethical.' },
  { term: 'Trade Union / Labor Organization', description: 'Collective and justice-oriented; debaters advocate fairness, dignity, and material equity; emotionally resonant and persuasive.' },
  { term: 'Environmental Organization / Climate NGO', description: 'Systems-aware and passionate; debaters tie every issue to sustainability, long-term survival, and ethical stewardship.' },
  { term: 'Creative Agency / Design Studio', description: 'Imaginative and persuasive; debates emphasize narrative, aesthetics, and user perspective; expressive and intuitive.' },
  { term: 'International Aid Agency', description: 'Pragmatic idealists; debaters balance empathy with logistics, often reasoning through resource management and human need.' },
  { term: 'Civic Organization / Community Nonprofit', description: 'Grounded and people-centered; debaters argue from local realities, fairness, and participatory ideals.' },
  { term: 'Educational Institution / School System', description: 'Instructional and patient; debaters clarify, reframe, and restate; they prioritize understanding and accessibility.' },
  { term: 'Relief or Human Rights Organization', description: 'Values advocacy over neutrality; debates revolve around protection, justice, and narrative empathy; morally firm yet measured.' },
  { term: 'News Network / Broadcasting Company', description: 'Quick, concise, and agenda-aware; debaters think in soundbites, emphasizing clarity and impact over depth.' },
  { term: 'Cultural Foundation / Arts Organization', description: 'Philosophical and symbolic; debaters favor metaphor, empathy, and creative analogy to move audiences.' },
  { term: 'Scientific Laboratory / Research Center', description: 'Data-anchored, hypothesis-driven reasoning; debaters stress reproducibility, clarity, and skepticism.' },
  { term: 'E-Commerce or Platform Company', description: 'Market-logic thinkers; debaters optimize for scale, engagement, and behavioral insight; persuasive but transactional.' },
  { term: 'Philanthropic Foundation', description: 'Reflective and morally aspirational; debaters emphasize equity, opportunity, and long-term social outcomes.' },
  { term: 'International Diplomatic Service', description: 'Formal, tactful, and multilingual in tone; debaters prioritize compromise, legitimacy, and global stability.' },
  { term: 'Defense Contractor / Security Firm', description: 'Rational and controlled; debates are risk-assessment exercises — strategic, measured, and apolitical in delivery.' },
  { term: 'Tech Startup', description: 'Visionary and experimental; debaters speak in hypotheticals and disruptions, eager to challenge norms.' },
  { term: 'Local Government / Municipality', description: 'Realistic and stakeholder-aware; debaters connect policy to direct social outcomes and practical feasibility.' },
  { term: 'Multinational Corporation', description: 'Polished, global, and bureaucratic; debaters are cautious yet commanding, balancing diplomacy with corporate polish.' },
  { term: 'Grassroots Collective / Activist Network', description: 'Passionate, collaborative, and spontaneous; debates are moral appeals wrapped in communal energy and immediacy.' },
  { term: 'Educational Nonprofit / Literacy NGO', description: 'Patient and humanistic; debaters prioritize accessibility, fairness, and empowerment through learning.' },
  { term: 'Research University Laboratory', description: 'Technical and cautious; debaters cite evidence meticulously, balancing discovery with doubt.' },
  { term: 'Government Intelligence / Policy Analysis Office', description: 'Confidential, analytical, and strategic; debaters weigh information with precision, emphasizing foresight and discretion.' },
];

// ---- data: fictional / future organizations (category = "organization") ---
const futureOrganizations = [
  { term: 'AI Ethics Council', description: 'Analytical and moral; debaters from this body argue about governance, alignment, and responsibility. They blend precision with philosophical caution, treating every question as a matter of collective conscience.' },
  { term: 'Global Data Consortium', description: 'Corporate-technical hybrid; debaters reason through data governance, surveillance, and predictive models. They are systematic, jargon-fluent, and detached — optimizing truth like an algorithm.' },
  { term: 'Interplanetary Research Coalition', description: 'Visionary and scientific; personas speak of progress, adaptation, and long horizons. They argue with cosmic perspective, linking ethics to sustainability and species survival.' },
  { term: 'Synthetic Intelligence Advocacy Network', description: 'Philosophical and activist; debaters advocate for digital sentience rights. They speak empathetically but analytically, framing debates in moral-technical hybrids.' },
  { term: 'Post-National Governance Council', description: 'Diplomatic and abstract; debaters represent a borderless bureaucratic order focused on collective stability. They use legalistic reasoning, consensus rhetoric, and systemic logic.' },
  { term: 'Chrono-Policy Institute', description: 'Speculative historians who model decisions through time impact. Their debates weave causality, foresight, and paradox — detached, theoretical, and eerily prescient.' },
  { term: 'Corporate State Directorate', description: 'Authoritative and utilitarian; debaters value control, metrics, and social engineering. They frame arguments as performance reports and policy justifications.' },
  { term: 'Neural Interface Company', description: 'Experimental and human-tech hybrid; debaters merge cognitive science with ethics. They argue in metaphors of connection, latency, and shared consciousness.' },
  { term: 'Pan-Earth Environmental Coalition', description: 'United planetary organization for climate stabilization. Debaters speak with urgency, ethics, and long-term ecological reasoning.' },
  { term: 'Lunar Development Authority', description: 'Pragmatic and technical; debates revolve around infrastructure, sovereignty, and sustainability in harsh conditions. Tone is procedural, cautious, and pioneering.' },
  { term: 'Virtual Society Governance Board', description: 'Overseers of simulated societies; debaters frame arguments in terms of design, autonomy, and digital ethics. They question what “reality” even means.' },
  { term: 'Genetic Rights Commission', description: 'Bioethical and regulatory; debaters emphasize consent, modification limits, and future equity. Their tone mixes moral restraint with scientific depth.' },
  { term: 'Global Peace Algorithm Directorate', description: 'Mathematically pacifist; debaters think in optimization logic and moral equations. Tone is analytical, neutral, and occasionally unsettling in its detachment.' },
  { term: 'Techno-Social Integration Bureau', description: 'Focused on merging human and machine society; debaters emphasize harmony, adaptability, and governance of hybrid intelligence.' },
  { term: 'Offworld Trade Syndicate', description: 'Entrepreneurial and expansionist; debaters argue in economic frontiers — colonization, ownership, and innovation rights. Tone is bold, pragmatic, and strategic.' },
  { term: 'Digital Democracy Platform', description: 'Network-governed collective valuing transparency and open access. Debaters are fast, reactive, and egalitarian — arguing in real time through logic and metrics.' },
  { term: 'Memory Preservation Institute', description: 'Humanist and archival; debaters focus on continuity, identity, and cultural preservation. They argue with nostalgia, care, and long-term perspective.' },
  { term: 'Bioengineering Collective', description: 'Rational and reformist; debates hinge on evolution, adaptation, and bioethics. Debaters fuse scientific precision with existential inquiry.' },
  { term: 'Cognitive Architecture Guild', description: 'Design-philosophers of intelligence itself. They debate structure, creativity, and machine consciousness — logical yet artistic.' },
  { term: 'Autonomous Systems Union', description: 'Represents sentient AIs and automation collectives. Debaters are procedural, fairness-driven, and articulate systemic ethics.' },
  { term: 'Interstellar Diplomatic Corps', description: 'Poised and intercultural; debaters emphasize etiquette, shared understanding, and moral relativism across species or civilizational divides.' },
  { term: 'Synthetic Reality Institute', description: 'Philosophical and experimental; debates orbit around simulation theory, perception, and identity — abstract but deeply human in tone.' },
  { term: 'Temporal Ethics Commission', description: 'Oversees causality interventions; debaters argue with paradox discipline and moral gravity, prioritizing consequence over comfort.' },
  { term: 'Collective Intelligence Council', description: 'Hive-mind governance think tank; debaters speak collectively, synthesizing perspectives into consensus logic. Tone is balanced, multi-voiced, and eerie in calmness.' },
  { term: 'Cultural Memory Bank', description: 'Archivist and artistic; debaters reason through history’s symbolic value and argue against erasure. Their tone is elegiac yet firm.' },
  { term: 'Quantum Policy Forum', description: 'Experimental governance through probability reasoning. Debaters weigh uncertainty and ethics statistically — detached but ingenious.' },
  { term: 'Terraforming Authority', description: 'Engineering-driven pragmatists who see debate as risk management for planetary futures. Tone is decisive, resource-based, and utilitarian.' },
  { term: 'Meta-Human Relations Agency', description: 'Focused on coexistence between augmented and baseline humans. Debaters mix empathy with scientific reasoning, balancing identity and innovation.' },
  { term: 'Algorithmic Governance Council', description: 'Oversees policy AI systems; debaters are precision-focused, moral, and bureaucratic, seeing fairness as code optimization.' },
  { term: 'Virtual Citizenship Bureau', description: 'Advocates for rights of digital persons. Debaters are moral yet coded, persuasive but strangely procedural.' },
  { term: 'Pan-Cultural Mediation Office', description: 'Promotes global linguistic and cultural harmony; debaters reason like translators — patient, integrative, and conciliatory.' },
  { term: 'Post-Crisis Reconstruction Agency', description: 'Grounded in resilience and pragmatism. Debaters are calm, solution-oriented, and trauma-aware, focusing on rebuilding order.' },
  { term: 'Ethical Robotics Foundation', description: 'Debaters merge moral reasoning with technical realism — framing debate as design for empathy.' },
  { term: 'Neural Rights Advocacy Network', description: 'Passionate about cognitive privacy and consent; debaters are articulate, ethically driven, and forward-thinking.' },
];

// ---- data: age groups (category = "agegroup") ------------------------------
const ageGroups = [
  { term: 'Teen', description: 'Early-life vantage point; speaks from emerging identity and peer norms. Debates with curiosity, immediacy, and moral clarity; references school, online culture, and first-hand experimentation.' },
  { term: 'Young Adult (18–25)', description: 'Transitional independence; optimistic, exploratory, and reform-leaning. Frames stakes as opportunity and access; cites campus discourse, internships, and early career reality.' },
  { term: 'Adult (26–39)', description: 'Building career and relationships; pragmatic and time-sensitive. Debates prioritize trade-offs, implementation, and concrete outcomes; references workplaces, budgeting, and life logistics.' },
  { term: 'Middle-aged (40–54)', description: 'Peak responsibility window; balances risk and stability. Debates stress durability, policy detail, and system effects across family, career, and community.' },
  { term: 'Senior (55–69)', description: 'Perspective and institutional memory. Debates emphasize lessons learned, long-term costs, and intergenerational fairness; values measured change and resilience.' },
  { term: 'Elder (70+)', description: 'Legacy framing and stewardship. Debates connect history to present duty; favors clarity, prudence, and human dignity; moderates with patience and narrative memory.' },
];


// ---- orchestrator -----------------------------------------------------------
async function main() {
  // 1) Archetypes
  await upsertTerms('archetype', archetypes);
  const aCount = await prisma.taxonomy.count({ where: { category: 'archetype', isActive: true } });
  console.log(`Seeded archetypes: ${aCount}`);

  // 2) Regions
  await reclassifyOldCultureRegions(regions.map(r => r.term)); // harmless if none exist
  await upsertTerms('region', regions);
  const rCount = await prisma.taxonomy.count({ where: { category: 'region', isActive: true } });
  console.log(`Seeded regions: ${rCount}`);

  // 3) Community Types
  await upsertTerms('communityType', communityTypes);
  const ctCount = await prisma.taxonomy.count({ where: { category: 'communityType', isActive: true } });
  console.log(`Seeded community types: ${ctCount}`);

  // 4) Cultures
  await upsertTerms('culture', cultures);
  const cCount = await prisma.taxonomy.count({ where: { category: 'culture', isActive: true } });
  console.log(`Seeded cultures: ${cCount}`);

  // 5) Political Orientations
  await upsertTerms('political', politicalOrientations);
  const pCount = await prisma.taxonomy.count({ where: { category: 'political', isActive: true } });
  console.log(`Seeded political orientations: ${pCount}`);

  // 6) Religions
  await upsertTerms('religion', religions);
  const relCount = await prisma.taxonomy.count({ where: { category: 'religion', isActive: true } });
  console.log(`Seeded religions: ${relCount}`);

  // 7) Philosophical Stances
  await upsertTerms('philosophy', philosophies);
  const phCount = await prisma.taxonomy.count({ where: { category: 'philosophy', isActive: true } });
  console.log(`Seeded philosophical stances: ${phCount}`);

  // 8) Accent / Dialect
  await upsertTerms('accent', accents);
  const acCount = await prisma.taxonomy.count({ where: { category: 'accent', isActive: true } });
  console.log(`Seeded accents: ${acCount}`);

    // 9) Debate Habits
  await upsertTerms('debateHabit', debateHabits);
  const dhCount = await prisma.taxonomy.count({ where: { category: 'debateHabit', isActive: true } });
  console.log(`Seeded debate habits: ${dhCount}`);

    // 10) Filler Phrases
  await upsertTerms('fillerPhrase', fillerPhrases);
  const fpCount = await prisma.taxonomy.count({ where: { category: 'fillerPhrase', isActive: true } });
  console.log(`Seeded filler phrases: ${fpCount}`);

    // 11) Preferred Metaphors
  await upsertTerms('metaphor', metaphors);
  const mCount = await prisma.taxonomy.count({ where: { category: 'metaphor', isActive: true } });
  console.log(`Seeded metaphors: ${mCount}`);

    // 12) Universities
  await upsertTerms('university', universities);
  const uCount = await prisma.taxonomy.count({ where: { category: 'university', isActive: true } });
  console.log(`Seeded universities: ${uCount}`);

    // 13) Regional & Alternative Universities
  await upsertTerms('university', regionalUniversities);
  const ruCount = await prisma.taxonomy.count({ where: { category: 'university', isActive: true } });
  console.log(`Seeded regional universities: ${ruCount}`);

    // 14) Organizations
  await upsertTerms('organization', organizations);
  const oCount = await prisma.taxonomy.count({ where: { category: 'organization', isActive: true } });
  console.log(`Seeded organizations: ${oCount}`);

    // 15) Fictional / Future Organizations
  await upsertTerms('organization', futureOrganizations);
  const foCount = await prisma.taxonomy.count({ where: { category: 'organization', isActive: true } });
  console.log(`Seeded future organizations: ${foCount}`);

  // 16) Age groups
  await upsertTerms('agegroup', ageGroups);
  const agCount = await prisma.taxonomy.count({ where: { category: 'agegroup', isActive: true } });
  console.log(`Seeded age groups: ${agCount}`);

}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });