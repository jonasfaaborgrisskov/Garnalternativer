// ─── Community Submissions ─────────────────────────────────────────────────

const SUBMISSIONS_STORAGE_KEY = 'garnalternativer_submissions';

function getSubmissions() {
  const stored = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : { submissions: [] };
}

function saveSubmissions(data) {
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(data));
}

function generateSubmissionId() {
  return 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ─── Pattern Submission ─────────────────────────────────────────────────

function validatePatternSubmission(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push('Opskriftsnavn skal være mindst 3 tegn');
  }
  if (!data.designer || data.designer.trim().length < 2) {
    errors.push('Designer-navn skal være mindst 2 tegn');
  }
  if (!data.originalYarnId) {
    errors.push('Vælg et garn');
  }
  if (!data.totalMeters_M || data.totalMeters_M <= 0) {
    errors.push('Meter skal være større end 0');
  }
  const difficulty = parseInt(data.difficulty);
  if (!difficulty || difficulty < 1 || difficulty > 10) {
    errors.push('Sværhedsgrad skal være mellem 1-10');
  }
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Beskrivelse skal være mindst 10 tegn');
  }

  return errors;
}

function submitPattern(data) {
  const errors = validatePatternSubmission(data);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const submissions = getSubmissions();
  const submission = {
    id: generateSubmissionId(),
    type: 'pattern',
    data: {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name.trim(),
      designer: data.designer.trim(),
      type: data.type || 'Sweater',
      emoji: '🧶',
      originalYarnId: data.originalYarnId,
      originalYarnCustom: data.originalYarnId?.startsWith('custom_') ? data.originalYarnId : null,
      secondaryYarnId: null,
      totalMeters_M: parseInt(data.totalMeters_M),
      difficulty: parseInt(data.difficulty),  // Now 1-10 instead of text
      estimatedHours: parseInt(data.estimatedHours) || 0,
      description: data.description.trim(),
      tags: ['community-submission', new Date().getFullYear().toString()],
      materials: [],
      seasonality: [],
      tiers: {
        budget: [],
        mid: [],
        premium: []
      }
    },
    submittedDate: new Date().toISOString().split('T')[0],
    author: data.author?.trim() || 'Anonym',
    email: data.email?.trim() || '',
    status: 'pending'
  };

  submissions.submissions.push(submission);
  saveSubmissions(submissions);
  return { success: true, submissionId: submission.id };
}

// ─── Yarn Submission ─────────────────────────────────────────────────

function validateYarnSubmission(data) {
  const errors = [];

  if (!data.brand || data.brand.trim().length < 2) {
    errors.push('Brandnavn skal være mindst 2 tegn');
  }
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Garnnavn skal være mindst 2 tegn');
  }
  if (!data.weight) {
    errors.push('Vælg garnvægt');
  }
  if (!data.gauge_stitches || data.gauge_stitches <= 0) {
    errors.push('Masketæthed skal være større end 0');
  }
  if (!data.gauge_needle_mm || data.gauge_needle_mm <= 0) {
    errors.push('Pindestørrelse skal være større end 0');
  }
  if (!data.meters_per_50g || data.meters_per_50g <= 0) {
    errors.push('Meter per 50g skal være større end 0');
  }
  if (!data.price_dkk_50g || data.price_dkk_50g <= 0) {
    errors.push('Pris skal være større end 0');
  }
  if (!data.fiber_composition || data.fiber_composition.trim().length < 3) {
    errors.push('Fiber-sammensætning skal være som minimum 3 tegn (fx "100% wool")');
  }

  return errors;
}

function submitYarn(data) {
  const errors = validateYarnSubmission(data);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const submissions = getSubmissions();
  const submission = {
    id: generateSubmissionId(),
    type: 'yarn',
    data: {
      id: (data.brand.trim() + '-' + data.name.trim()).toLowerCase().replace(/\s+/g, '-'),
      brand: data.brand.trim(),
      name: data.name.trim(),
      tier: 'mid',
      weight: data.weight,
      gauge: {
        stitches: parseInt(data.gauge_stitches),
        needle_mm: parseFloat(data.gauge_needle_mm),
      },
      fiber: parseFiberComposition(data.fiber_composition.trim()),
      meters_per_50g: parseInt(data.meters_per_50g),
      price_dkk_50g: parseInt(data.price_dkk_50g),
      care: 'See yarn label for care instructions',
      eco: data.eco === 'on',
      vegan: data.vegan === 'on',
      mulesing_free: data.mulesing_free === 'on',
      buyUrl: data.buyUrl?.trim() || '',
      description: 'Community submission: ' + data.fiber_composition.trim(),
    },
    submittedDate: new Date().toISOString().split('T')[0],
    author: data.author?.trim() || 'Anonym',
    email: data.email?.trim() || '',
    status: 'pending'
  };

  submissions.submissions.push(submission);
  saveSubmissions(submissions);
  return { success: true, submissionId: submission.id };
}

function parseFiberComposition(text) {
  // Simple parser for "100% wool" or "70% wool, 30% silk" format
  const parts = text.split(',').map(s => s.trim());
  return parts.map(part => {
    const match = part.match(/(\d+)%\s*(.+)/);
    if (match) {
      return { pct: parseInt(match[1]), name: match[2].trim() };
    }
    return { pct: 0, name: part };
  }).filter(f => f.pct > 0);
}

// ─── Admin Functions ─────────────────────────────────────────────────

function getSubmissionsByStatus(status) {
  const submissions = getSubmissions();
  return submissions.submissions.filter(s => s.status === status);
}

function approveSubmission(submissionId) {
  const submissions = getSubmissions();
  const idx = submissions.submissions.findIndex(s => s.id === submissionId);
  if (idx >= 0) {
    submissions.submissions[idx].status = 'approved';
    submissions.submissions[idx].approvedDate = new Date().toISOString().split('T')[0];
    saveSubmissions(submissions);
    return true;
  }
  return false;
}

function rejectSubmission(submissionId) {
  const submissions = getSubmissions();
  const idx = submissions.submissions.findIndex(s => s.id === submissionId);
  if (idx >= 0) {
    submissions.submissions[idx].status = 'rejected';
    saveSubmissions(submissions);
    return true;
  }
  return false;
}

function deleteSubmission(submissionId) {
  const submissions = getSubmissions();
  submissions.submissions = submissions.submissions.filter(s => s.id !== submissionId);
  saveSubmissions(submissions);
}

function exportSubmissionsAsJson() {
  const submissions = getSubmissions();
  return JSON.stringify(submissions, null, 2);
}

function exportPatternAsDataJs(submission) {
  if (submission.type !== 'pattern') return null;

  const data = submission.data;
  return `{
  id: '${data.name.toLowerCase().replace(/\s+/g, '-')}',
  name: '${data.name}',
  designer: '${data.designer}',
  type: '${data.type}',
  emoji: '🧶',
  difficulty: ${data.difficulty},
  description: '${data.description}',
  originalYarn_id: '${data.originalYarnId}',
  totalMeters_M: ${data.totalMeters_M},
  tags: ['community-submission', '${new Date().getFullYear()}'],
  materials: [],
  seasonality: [],
  estimatedHours: ${data.estimatedHours},
  tiers: {
    budget: [],
    mid: [],
    premium: []
  }
},`;
}

function exportYarnAsDataJs(submission) {
  if (submission.type !== 'yarn') return null;

  const data = submission.data;
  return `{
  id: '${data.name.toLowerCase().replace(/\s+/g, '-')}',
  name: '${data.name}',
  brand: '${data.brand}',
  tier: 'mid',
  weight: '${data.weight}',
  gauge: { stitches: ${data.gauge.stitches}, needle_mm: ${data.gauge.needle_mm} },
  fiber: [
    // TODO: Parse fiberComposition into array format
    // Example: { name: 'Wool', pct: 80 }
  ],
  meters_per_50g: ${data.meters_per_50g},
  price_dkk_50g: ${data.price_dkk_50g},
  care: 'Hand wash, lay flat to dry',
  eco: ${data.eco},
  vegan: ${data.vegan},
  mulesing_free: ${data.mulesing_free},
  buyUrl: '${data.buyUrl}',
  description: 'Community submission: ${data.fiberComposition}'
},`;
}
