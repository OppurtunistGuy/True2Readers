// Curated Phase 0 Reader Experience Database for True2Readers
// Real reader friction, pacing reality, prose feel, and honest potential mismatches.
import type { Book } from '@/components/trueread/types'

export interface ReaderExperienceDimension {
  label: string
  nuance: string
}

export interface ReaderExperienceProfile {
  bookKey: string
  title: string
  author: string
  isbn13?: string
  isbn10?: string
  volumeId?: string
  genre: string
  tags: string[]
  // Match criteria mapping for Screen 1 intent
  intentMatch: {
    pace: ('fast' | 'steady' | 'slow_burn')[]
    effort: ('low' | 'moderate' | 'deep')[]
    focus: ('story' | 'characters' | 'ideas' | 'writing')[]
  }
  // Discovery card signals (Screen 2)
  whySurfaced: string
  readerSignal: string
  potentialMismatchCard: string
  // Detail page deep signals (Screen 3)
  experience: {
    pacing: ReaderExperienceDimension
    writing: ReaderExperienceDimension
    complexity: ReaderExperienceDimension
    focus: ReaderExperienceDimension
    emotional: ReaderExperienceDimension
  }
  mismatch: string[]
  consensus: string
}

export const CURATED_READER_EXPERIENCES: ReaderExperienceProfile[] = [
  {
    bookKey: 'atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn13: '9780735211292',
    isbn10: '0735211299',
    genre: 'Self-Help / Psychology',
    tags: ['Practical Framework', 'Action-Oriented', 'Brisk Pace'],
    intentMatch: {
      pace: ['fast', 'steady'],
      effort: ['low', 'moderate'],
      focus: ['ideas', 'story'],
    },
    whySurfaced: 'Matches your preference for immediate, actionable concepts with clear, direct prose.',
    readerSignal: 'Readers consistently highlight the compounding 1% rule and immediate daily applicability.',
    potentialMismatchCard: 'Can feel repetitive if you already understand behavioral habit loops or read Duhigg.',
    experience: {
      pacing: {
        label: 'Direct and fast-moving',
        nuance: 'Short, punchy chapters designed for rapid reading and immediate practical takeaways.',
      },
      writing: {
        label: 'Transparent and conversational',
        nuance: 'Zero academic jargon. Relies heavily on anecdotal case studies and structured bullet points.',
      },
      complexity: {
        label: 'Low cognitive load',
        nuance: 'Concepts are intentionally simplified into modular, repeatable 4-step rules.',
      },
      focus: {
        label: 'System design over theory',
        nuance: 'Focuses on environment architecture rather than relying on elusive motivation or willpower.',
      },
      emotional: {
        label: 'Pragmatic and empowering',
        nuance: 'Readers report feeling in control and motivated to build small routines without overwhelm.',
      },
    },
    mismatch: [
      'If you have already studied habit formation or read "The Power of Habit", much of the core psychology will feel redundant.',
      'Readers looking for deep neuroscience or clinical analysis will find the anecdotal stories overly simplified.',
    ],
    consensus: 'A crisp, actionable blueprint that excels at practical implementation rather than novel psychological theory.',
  },
  {
    bookKey: 'dune',
    title: 'Dune',
    author: 'Frank Herbert',
    isbn13: '9780441013593',
    isbn10: '0441013597',
    genre: 'Science Fiction / Epic',
    tags: ['Immersive World', 'Feudal Politics', 'Demanding Start'],
    intentMatch: {
      pace: ['slow_burn'],
      effort: ['deep'],
      focus: ['ideas', 'story'],
    },
    whySurfaced: 'Fits your desire for a deep, complex dive with colossal political and ecological scale.',
    readerSignal: 'Readers praise the unmatched world-building and philosophical depth once past chapter 4.',
    potentialMismatchCard: 'The first 100 pages drop you into in-world jargon with minimal context.',
    experience: {
      pacing: {
        label: 'Slow start with massive acceleration',
        nuance: 'Opening 80–100 pages are dense with political exposition before narrative momentum surges.',
      },
      writing: {
        label: 'Layered and formal',
        nuance: 'Relies heavily on internal monologues, ecological terms, and appended glossary vocabulary.',
      },
      complexity: {
        label: 'High cognitive investment',
        nuance: 'Intertwines religion, feudal ecology, prescience, and political intrigue on multiple fronts.',
      },
      focus: {
        label: 'Systems and ecology over intimate warmth',
        nuance: 'Characters are larger-than-life archetypes functioning inside sweeping civilizational shifts.',
      },
      emotional: {
        label: 'Awe and tension rather than warmth',
        nuance: 'Creates an epic, cerebral atmosphere of impending destiny rather than cozy connection.',
      },
    },
    mismatch: [
      'If you need immediate action or transparent prose, the heavy in-world terminology and slow opening will frustrate you.',
      'Readers seeking emotionally vulnerable, relatable character arcs may find the formal dialogue distant.',
    ],
    consensus: 'A monumental, demanding epic with unrivaled world-building that rewards patient, focused readers.',
  },
  {
    bookKey: 'the-silent-patient',
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    isbn13: '9781250301697',
    isbn10: '1250301696',
    genre: 'Psychological Thriller',
    tags: ['Page-Turner', 'Psychological Tension', 'Twist Ending'],
    intentMatch: {
      pace: ['fast'],
      effort: ['low', 'moderate'],
      focus: ['story', 'characters'],
    },
    whySurfaced: 'Matches your search for a gripping, fast-moving psychological mystery with high tension.',
    readerSignal: 'Readers widely report finishing in one or two sittings due to short, suspenseful chapters.',
    potentialMismatchCard: 'Psychiatric protocols are medically unrealistic; the central twist divides readers.',
    experience: {
      pacing: {
        label: 'Relentless and swift',
        nuance: 'Very short chapters ending on micro-cliffhangers make it almost effortless to keep turning pages.',
      },
      writing: {
        label: 'Accessible and plot-first',
        nuance: 'Clean, simple prose that never gets in the way of the unfolding investigation.',
      },
      complexity: {
        label: 'Moderate — dual narrative threads',
        nuance: 'Alternates between the therapist’s narration and diary entries with easy-to-follow clues.',
      },
      focus: {
        label: 'Plot twists and puzzle resolution',
        nuance: 'Built specifically around the central mystery: why did Alicia shoot her husband and stop speaking?',
      },
      emotional: {
        label: 'Uneasy suspense and curiosity',
        nuance: 'Drives intense curiosity and suspicion toward every supporting character.',
      },
    },
    mismatch: [
      'Mental health professionals and readers seeking realistic therapy ethics will find the clinical setting implausible.',
      'Readers who actively analyze twist mechanics may spot the timeline construction early on.',
    ],
    consensus: 'A sharp, addictive commercial thriller that prioritizes pacing and suspense over realistic clinical detail.',
  },
  {
    bookKey: '1984',
    title: '1984',
    author: 'George Orwell',
    isbn13: '9780451524935',
    isbn10: '0451524934',
    genre: 'Dystopian Classic',
    tags: ['Surveillance State', 'Psychological Dread', 'Uncompromising'],
    intentMatch: {
      pace: ['steady', 'slow_burn'],
      effort: ['moderate', 'deep'],
      focus: ['ideas', 'story'],
    },
    whySurfaced: 'Fits your interest in powerful, thought-provoking literature that examines truth and societal control.',
    readerSignal: 'Readers find the psychological erosion of reality and Newspeak concepts unforgettable.',
    potentialMismatchCard: 'Deeply bleak; includes a 30-page theoretical book-within-a-book in Act 2.',
    experience: {
      pacing: {
        label: 'Steady atmospheric tension with a harrowing climax',
        nuance: 'Builds constant psychological dread, interrupted by a dense theoretical manifesto section in the middle.',
      },
      writing: {
        label: 'Lucid, sharp, and austere',
        nuance: 'Orwell’s prose is direct and clinical, stripping away romanticism to heighten totalitarian horror.',
      },
      complexity: {
        label: 'Moderate to deep thematic weight',
        nuance: 'Examines linguistic manipulation (Doublethink/Newspeak), state control, and identity erosion.',
      },
      focus: {
        label: 'Societal critique and political psychology',
        nuance: 'Winston’s personal rebellion serves as a case study in how totalitarian power crushes individual will.',
      },
      emotional: {
        label: 'Suffocating dread and bleak realism',
        nuance: 'Offers zero comforting illusions or Hollywood-style triumph.',
      },
    },
    mismatch: [
      'If you are looking for an optimistic escape or a comforting resolution, the relentless bleakness will drain you.',
      'The extensive political essay embedded in the second half halts narrative momentum for several chapters.',
    ],
    consensus: 'An essential, chilling masterwork of psychological and political dread that refuses to offer easy comfort.',
  },
  {
    bookKey: 'the-alchemist',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn13: '9780062315007',
    isbn10: '0062315005',
    genre: 'Philosophical Fable',
    tags: ['Short Fable', 'Reflective', 'Simple Allegory'],
    intentMatch: {
      pace: ['fast', 'steady'],
      effort: ['low'],
      focus: ['ideas', 'writing'],
    },
    whySurfaced: 'Matches your desire for a light, reflective read centered on purpose, destiny, and perspective.',
    readerSignal: 'Readers love the gentle, poetic fable format that can be read in an afternoon.',
    potentialMismatchCard: 'Can read like surface-level self-help aphorisms if you prefer nuanced fiction.',
    experience: {
      pacing: {
        label: 'Brisk and flowing',
        nuance: 'Short journey narrative under 200 pages that moves smoothly from scene to scene.',
      },
      writing: {
        label: 'Poetic, fable-like simplicity',
        nuance: 'Written in sparse, parabolic language reminiscent of traditional folklore and moral tales.',
      },
      complexity: {
        label: 'Very accessible',
        nuance: 'The philosophical lessons are stated openly without complex subtext.',
      },
      focus: {
        label: 'Spiritual destiny and personal myth',
        nuance: 'Santiago’s physical travels across Andalusia and Egypt mirror his internal search for purpose.',
      },
      emotional: {
        label: 'Hopeful, tranquil, and reflective',
        nuance: 'Designed to inspire reflection on life goals, dreams, and trusting your intuition.',
      },
    },
    mismatch: [
      'Readers who dislike spiritual metaphors or overt "follow your dreams" maxims may find the story simplistic or preachy.',
      'If you want multi-dimensional character arcs and complex plotting, this fable will feel insubstantial.',
    ],
    consensus: 'A soothing, inspirational parable that resonates deeply as folklore but lacks complex novelistic grit.',
  },
  {
    bookKey: 'the-psychology-of-money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    isbn13: '9780857197689',
    isbn10: '0857197681',
    genre: 'Finance / Behavior',
    tags: ['Nuanced Thinking', 'Short Essays', 'Human Behavior'],
    intentMatch: {
      pace: ['fast', 'steady'],
      effort: ['low', 'moderate'],
      focus: ['ideas'],
    },
    whySurfaced: 'Fits your preference for thought-provoking ideas delivered through clear, digestible stories.',
    readerSignal: 'Readers praise the focus on human flaws, greed, and ego over dry financial math.',
    potentialMismatchCard: 'Contains little tactical investing formulas; focused on mindset rather than portfolio picks.',
    experience: {
      pacing: {
        label: 'Brisk 19-chapter structure',
        nuance: 'Each chapter is a standalone 8–10 page essay with its own historical narrative and takeaway.',
      },
      writing: {
        label: 'Engaging, journalistic clarity',
        nuance: 'Housel writes with exceptional readability, blending history, behavioral research, and vivid analogies.',
      },
      complexity: {
        label: 'Accessible to absolute beginners',
        nuance: 'Requires zero background in finance or economics; focuses on human temperament.',
      },
      focus: {
        label: 'Behavior and psychology over spreadsheets',
        nuance: 'Argues that doing well with money is about how you behave, not how smart you are with numbers.',
      },
      emotional: {
        label: 'Reassuring and perspective-shifting',
        nuance: 'Relieves financial anxiety by redefining "enough" and highlighting the value of peace of mind.',
      },
    },
    mismatch: [
      'If you are seeking advanced stock analysis, tax optimization, or technical trading strategies, this book will not provide them.',
    ],
    consensus: 'An essential, beautifully written perspective on wealth and human behavior that anyone can finish in days.',
  },
  {
    bookKey: 'sapiens',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn13: '9780062316110',
    isbn10: '0062316117',
    genre: 'History / Anthropology',
    tags: ['Sweeping History', 'Mind-Expanding', 'Big Concepts'],
    intentMatch: {
      pace: ['steady'],
      effort: ['moderate', 'deep'],
      focus: ['ideas', 'writing'],
    },
    whySurfaced: 'Matches your appetite for ambitious, perspective-altering books exploring human evolution and society.',
    readerSignal: 'Readers find the "shared fiction / money / religion" cognitive revolution arguments unforgettable.',
    potentialMismatchCard: 'Makes broad generalizations; professional historians criticize some speculative claims.',
    experience: {
      pacing: {
        label: 'Sweeping and steadily engaging',
        nuance: 'Covers 70,000 years of history with bold thematic leaps rather than dry chronological timelines.',
      },
      writing: {
        label: 'Provocative and lucid',
        nuance: 'Uses sharp metaphors and thought experiments to challenge assumptions about human progress.',
      },
      complexity: {
        label: 'Moderate — high concept, accessible delivery',
        nuance: 'Explains complex anthropological concepts in intuitive, engaging prose.',
      },
      focus: {
        label: 'Macro-narratives and human constructs',
        nuance: 'Focuses on the cognitive, agricultural, and scientific revolutions that shaped civilization.',
      },
      emotional: {
        label: 'Disorienting and awe-inspiring',
        nuance: 'Forces you to step back and view our species from a cosmic, detached vantage point.',
      },
    },
    mismatch: [
      'Readers looking for rigorous, citation-dense academic history will find some assertions speculative.',
      'The later chapters on modern happiness and biotechnology are more philosophical musings than historical fact.',
    ],
    consensus: 'A thrilling, macro-scale rethink of human history that trades academic caution for grand, stimulating narrative.',
  },
  {
    bookKey: 'harry-potter-1',
    title: "Harry Potter and the Sorcerer's Stone",
    author: 'J.K. Rowling',
    isbn13: '9780439708180',
    isbn10: '0439708184',
    genre: 'Fantasy / Adventure',
    tags: ['Cozy Escape', 'Whimsical World', 'Fast Moving'],
    intentMatch: {
      pace: ['fast'],
      effort: ['low'],
      focus: ['story', 'characters'],
    },
    whySurfaced: 'Fits your need for an easy, delightful escape with charming characters and constant discovery.',
    readerSignal: 'Readers cherish the warm, nostalgic atmosphere and effortless page-turning charm.',
    potentialMismatchCard: 'Targeted at younger readers; lighter and more simplistic than later entries in the series.',
    experience: {
      pacing: {
        label: 'Rapid and buoyant',
        nuance: 'Moves quickly through the school year with constant new discoveries and humorous episodes.',
      },
      writing: {
        label: 'Playful, British, and accessible',
        nuance: 'Full of witty descriptions, eccentric names, and cozy, sensory details of castle life.',
      },
      complexity: {
        label: 'Light and effortless',
        nuance: 'Clear moral lines and straightforward mystery plotting suitable for all reading levels.',
      },
      focus: {
        label: 'Friendship and discovery',
        nuance: 'The bond between Harry, Ron, and Hermione anchors every magical adventure.',
      },
      emotional: {
        label: 'Warm, wondrous, and comforting',
        nuance: 'Delivers a deep sense of belonging, curiosity, and joyful escapism.',
      },
    },
    mismatch: [
      'Adult readers expecting high-stakes dark fantasy or complex magic systems will find the first volume juvenile.',
    ],
    consensus: 'A timeless, cozy fantasy entry point bursting with charm and effortless narrative momentum.',
  },
  {
    bookKey: 'the-great-gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn13: '9780743273565',
    isbn10: '0743273567',
    genre: 'Classic / Literary Fiction',
    tags: ['Lyrical Prose', 'Tragic Illusion', 'Short Classic'],
    intentMatch: {
      pace: ['steady'],
      effort: ['moderate'],
      focus: ['writing', 'characters'],
    },
    whySurfaced: 'Matches your interest in gorgeous, stylized prose and tragic character studies.',
    readerSignal: 'Readers consistently cite the lyrical language and evocative 1920s mood as unmatched.',
    potentialMismatchCard: 'Almost every character is morally hollow and unsympathetic by design.',
    experience: {
      pacing: {
        label: 'Tightly controlled slow burn',
        nuance: 'Under 180 pages, built around atmospheric dinner parties and quiet observational tension.',
      },
      writing: {
        label: 'Lyrical, dazzling, and rhythmic',
        nuance: 'Some of the most famous sentences in American literature, rich in visual symbolism and rhythm.',
      },
      complexity: {
        label: 'Moderate — layered subtext',
        nuance: 'The plot is simple, but the critique of class, memory, and the American dream is layered.',
      },
      focus: {
        label: 'Obsession, illusion, and observation',
        nuance: 'Told through the detached perspective of Nick Carraway as he watches Gatsby’s doomed delusion.',
      },
      emotional: {
        label: 'Haunting melancholy and disillusionment',
        nuance: 'Leaves a lingering ache regarding the impossibility of repeating the past.',
      },
    },
    mismatch: [
      'If you need to root for a morally admirable protagonist, the self-absorbed cast will alienate you.',
      'Readers forced to read it in school who disliked symbolism-heavy prose may still find it detached.',
    ],
    consensus: 'A brief, exquisitely written tragedy that rewards readers who appreciate prose style over likable characters.',
  },
  {
    bookKey: 'normal-people',
    title: 'Normal People',
    author: 'Sally Rooney',
    isbn13: '9781984822185',
    isbn10: '1984822187',
    genre: 'Contemporary / Literary Romance',
    tags: ['Intimate Character Study', 'Raw Dialogue', 'Unconventional Style'],
    intentMatch: {
      pace: ['steady'],
      effort: ['moderate'],
      focus: ['characters', 'writing'],
    },
    whySurfaced: 'Fits your desire for an emotionally intimate character study focused on relationships and vulnerability.',
    readerSignal: 'Readers find Connell and Marianne’s dynamic intensely real and painfully relatable.',
    potentialMismatchCard: 'No quotation marks used for dialogue; characters struggle deeply with basic communication.',
    experience: {
      pacing: {
        label: 'Episodic and chronological jumps',
        nuance: 'Jumps forward months at a time, focusing exclusively on pivotal interactions between the two leads.',
      },
      writing: {
        label: 'Sparse, stripped-back, no quotation marks',
        nuance: 'Dialogue blends directly into internal narration in a raw, minimalist Irish literary voice.',
      },
      complexity: {
        label: 'Moderate — emotional nuance over plot',
        nuance: 'Very little happens in terms of external events; the complexity lies entirely in social power dynamics.',
      },
      focus: {
        label: 'Class, trauma, and intimacy',
        nuance: 'Examines how two people shape, hurt, and heal each other as they move from high school to university.',
      },
      emotional: {
        label: 'Ache, vulnerability, and quiet tenderness',
        nuance: 'Can feel deeply melancholy and intimate for readers who connect with social alienation.',
      },
    },
    mismatch: [
      'Readers frustrated by characters who make poor life decisions and refuse to communicate will find this maddening.',
      'The complete lack of standard quotation marks is a visual turn-off for some readers.',
    ],
    consensus: 'A tender, hyper-observant portrait of modern intimacy that trades plot mechanics for raw emotional realism.',
  },
  {
    bookKey: 'the-hitchhikers-guide-to-the-galaxy',
    title: "The Hitchhiker's Guide to the Galaxy",
    author: 'Douglas Adams',
    isbn13: '9780345391803',
    isbn10: '0345391802',
    genre: 'Sci-Fi / Satire / Comedy',
    tags: ['Absurdist Comedy', 'Brisk & Hilarious', 'Witty Prose'],
    intentMatch: {
      pace: ['fast'],
      effort: ['low'],
      focus: ['writing', 'ideas'],
    },
    whySurfaced: 'Matches your wish for a witty, relaxing, laugh-out-loud satirical escape.',
    readerSignal: 'Readers praise the British absurdity, iconic one-liners, and philosophical silliness.',
    potentialMismatchCard: 'Plot is virtually non-existent; it is a rapid series of absurdist comedic sketches.',
    experience: {
      pacing: {
        label: 'Fast and manic',
        nuance: 'Under 220 pages, moving from one bizarre cosmic catastrophe to another at breakneck speed.',
      },
      writing: {
        label: 'Brilliantly witty and dryly absurdist',
        nuance: 'Packed with British irony, satirical footnotes, and philosophical jokes on the meaning of life.',
      },
      complexity: {
        label: 'Lighthearted and effortless',
        nuance: 'Zero hard science fiction; concepts exist purely to deliver comedic and satirical punchlines.',
      },
      focus: {
        label: 'Satire of bureaucracy and existential absurdity',
        nuance: 'Uses the destruction of Earth as an opening joke to mock human self-importance.',
      },
      emotional: {
        label: 'Hilarious, buoyant, and irreverent',
        nuance: 'Keeps you smiling with relentless comedic energy and whimsical inventiveness.',
      },
    },
    mismatch: [
      'If you need a serious narrative arc with stakes and character growth, the total absurdity will feel pointless.',
      'Readers who do not enjoy Monty Python-esque dry British humor will not find the jokes funny.',
    ],
    consensus: 'A comedic masterpiece of cosmic absurdity that delivers pure entertainment through brilliant satire.',
  },
  {
    bookKey: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    isbn13: '9781612680194',
    isbn10: '1612680194',
    genre: 'Personal Finance / Mindset',
    tags: ['Mindset Shift', 'Assets vs Liabilities', 'Conversational'],
    intentMatch: {
      pace: ['fast'],
      effort: ['low'],
      focus: ['ideas'],
    },
    whySurfaced: 'Fits your interest in quick, foundational financial mindset shifts and asset-building perspectives.',
    readerSignal: 'Readers credit this book with first explaining the difference between assets and liabilities.',
    potentialMismatchCard: 'Anecdotes are largely fictionalized; offers zero specific, balanced investment advice.',
    experience: {
      pacing: {
        label: 'Fast and simple',
        nuance: 'Conversational narrative that repeats core financial mantras across brief chapters.',
      },
      writing: {
        label: 'Informal and persuasive',
        nuance: 'Written in plain, accessible language using childhood comparisons between two father figures.',
      },
      complexity: {
        label: 'Very low',
        nuance: 'Reduces financial philosophy to visual cash-flow diagrams and repeatable slogans.',
      },
      focus: {
        label: 'Financial literacy mindset',
        nuance: 'Focuses on getting out of the "rat race" by acquiring income-generating assets instead of liabilities.',
      },
      emotional: {
        label: 'Eye-opening for beginners, provocative',
        nuance: 'Challenges traditional schooling and employment assumptions.',
      },
    },
    mismatch: [
      'Critiqued by financial professionals for advocating questionable tax tricks and oversimplifying real estate risk.',
      'Readers looking for disciplined, index-fund investing advice will find the mindset aggressive and ungrounded.',
    ],
    consensus: 'An effective psychological catalyst for financial beginners, best read for mindset rather than specific tactics.',
  },
  {
    bookKey: 'gone-girl',
    title: 'Gone Girl',
    author: 'Gillian Flynn',
    isbn13: '9780307588371',
    isbn10: '0307588378',
    genre: 'Psychological Thriller',
    tags: ['Dark & Twisty', 'Unreliable Narrators', 'Sharp Satire'],
    intentMatch: {
      pace: ['fast', 'steady'],
      effort: ['moderate'],
      focus: ['story', 'characters', 'writing'],
    },
    whySurfaced: 'Matches your search for a dark, razor-sharp psychological thriller with unreliable narration.',
    readerSignal: 'Readers highlight the famous midpoint twist and the chilling portrait of toxic marriage.',
    potentialMismatchCard: 'Deeply cynical; neither lead is likable, and the ending is deliberately infuriating.',
    experience: {
      pacing: {
        label: 'Deliberate setup leading into a manic second half',
        nuance: 'First half lays careful traps before the narrative flips on its head with electrifying speed.',
      },
      writing: {
        label: 'Acidic, stylish, and incisive',
        nuance: 'Flynn’s prose is venomous and witty, tearing apart media circuses and marital resentments.',
      },
      complexity: {
        label: 'Moderate to high narrative trickery',
        nuance: 'Dueling first-person timelines where both narrators are actively lying to each other and the reader.',
      },
      focus: {
        label: 'Marital toxicity and performance',
        nuance: 'A vicious dissection of how people curate fake personalities to be loved, and the rage when illusions drop.',
      },
      emotional: {
        label: 'Cynical, thrilling, and jaw-dropping',
        nuance: 'Keeps you tense, unsettled, and eager to see who out-manipulates whom.',
      },
    },
    mismatch: [
      'If you need a satisfying moral resolution where bad deeds are cleanly punished, the ending will infuriate you.',
      'Contains dark themes, bitter cynicism, and toxic manipulation that may disturb sensitive readers.',
    ],
    consensus: 'A deliciously wicked, razor-sharp psychological thriller that redefined modern unreliable narration.',
  },
  {
    bookKey: 'the-midnight-library',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    isbn13: '9780525559474',
    isbn10: '0525559477',
    genre: 'Contemporary / Speculative',
    tags: ['Second Chances', 'Parallel Lives', 'Comfort Read'],
    intentMatch: {
      pace: ['fast', 'steady'],
      effort: ['low', 'moderate'],
      focus: ['ideas', 'story'],
    },
    whySurfaced: 'Fits your mood for an uplifting, concept-driven exploration of regret, choices, and appreciation.',
    readerSignal: 'Readers find the library of unlived lives comforting and helpful during times of self-doubt.',
    potentialMismatchCard: 'The central moral message is telegraphed early and repeated frequently.',
    experience: {
      pacing: {
        label: 'Brisk and episodic',
        nuance: 'Moves through multiple alternate lives in short, digestible vignettes that maintain interest.',
      },
      writing: {
        label: 'Simple, accessible, and direct',
        nuance: 'Clean commercial fiction prose that reads smoothly and quickly.',
      },
      complexity: {
        label: 'Low to moderate',
        nuance: 'The multiverse mechanism is straightforward magical realism without complex quantum mechanics.',
      },
      focus: {
        label: 'Regret, mental health, and gratitude',
        nuance: 'Explores Nora’s "Book of Regrets" as she tests what life would be like had she made different choices.',
      },
      emotional: {
        label: 'Warm, reassuring, and hopeful',
        nuance: 'Offers gentle perspective on overcoming depression and accepting the life you have.',
      },
    },
    mismatch: [
      'Readers expecting hard sci-fi multiverse lore or unpredictable twists will find the life lessons predictable.',
      'The opening chapters deal directly with suicidal ideation, which may be triggering for some readers.',
    ],
    consensus: 'A comforting, accessible modern fable about gratitude and regret that reads like a warm literary hug.',
  },
  {
    bookKey: 'think-and-grow-rich',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    isbn13: '9781585424337',
    isbn10: '1585424331',
    genre: 'Classic Self-Help / Philosophy',
    tags: ['Mindset Pioneer', 'Definiteness of Purpose', '1930s Style'],
    intentMatch: {
      pace: ['steady'],
      effort: ['moderate'],
      focus: ['ideas'],
    },
    whySurfaced: 'Matches your interest in historical foundational self-mastery and the origins of manifestation thinking.',
    readerSignal: 'Readers value the historical perspective on Carnegie, Edison, and the power of obsession.',
    potentialMismatchCard: 'Contains dated 1930s mysticism and pseudo-scientific claims about brain vibrations.',
    experience: {
      pacing: {
        label: 'Steady and repetitive',
        nuance: 'Emphasizes 13 principles with substantial repetition across historical character examples.',
      },
      writing: {
        label: 'Formal, evangelical 1930s rhetoric',
        nuance: 'Written in an old-fashioned, dramatic style full of earnest conviction and capitalized key phrases.',
      },
      complexity: {
        label: 'Low conceptual barrier, dated context',
        nuance: 'Easy to grasp, though modern readers must filter out early 20th-century pseudo-science.',
      },
      focus: {
        label: 'Definite major purpose and autosuggestion',
        nuance: 'Argues that burning desire and mental discipline are the prerequisites to any material achievement.',
      },
      emotional: {
        label: 'Motivational and earnest',
        nuance: 'Instills confidence and stubborn determination to persist through failure.',
      },
    },
    mismatch: [
      'Modern analytical readers will roll their eyes at the mystical claims of "Infinite Intelligence" and telepathy.',
      'Offers no practical modern investment or career framework; it is 100% focused on psychological conditioning.',
    ],
    consensus: 'A historic, vintage personal development classic that invented modern success mindset literature.',
  },
]

// Normalization helper for title & author matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Robust matching against the curated reader-experience database.
 * Priority:
 * 1. ISBN-13 exact match
 * 2. Google volumeId match
 * 3. ISBN-10 exact match
 * 4. Normalized title + author fallback
 */
export function getReaderExperience(book: Book | null | undefined): ReaderExperienceProfile | null {
  if (!book) return null

  // 1. ISBN-13
  const bookIsbn13 = (book.isbn13 || book.isbn || '').replace(/[^0-9X]/gi, '')
  if (bookIsbn13.length >= 10) {
    const match = CURATED_READER_EXPERIENCES.find(
      (p) => p.isbn13 && p.isbn13.replace(/[^0-9X]/gi, '') === bookIsbn13
    )
    if (match) return match
  }

  // 2. ISBN-10
  const bookIsbn10 = (book.isbn10 || '').replace(/[^0-9X]/gi, '')
  if (bookIsbn10.length === 10) {
    const match = CURATED_READER_EXPERIENCES.find(
      (p) => p.isbn10 && p.isbn10.replace(/[^0-9X]/gi, '') === bookIsbn10
    )
    if (match) return match
  }

  // 3. Volume ID match
  if (book.id) {
    const match = CURATED_READER_EXPERIENCES.find((p) => p.volumeId === book.id)
    if (match) return match
  }

  // 4. Normalized title + primary author fallback
  const normBookTitle = normalizeText(book.title || '')
  if (normBookTitle.length > 2) {
    const normAuthor = normalizeText(book.authors?.[0] || '')
    const match = CURATED_READER_EXPERIENCES.find((p) => {
      const pTitle = normalizeText(p.title)
      const pAuthor = normalizeText(p.author)
      const titleMatch = normBookTitle.includes(pTitle) || pTitle.includes(normBookTitle)
      if (!titleMatch) return false
      if (normAuthor.length > 2 && pAuthor.length > 2) {
        return normAuthor.includes(pAuthor) || pAuthor.includes(normAuthor)
      }
      return true
    })
    if (match) return match
  }

  return null
}
