require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Root Route for browser access
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Oxygen Sports AI Backend API is running successfully!',
    endpoints: ['/api/generate', '/api/history', '/api/analytics']
  });
});

// Initialize Supabase Client
let supabase;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
} else {
  console.warn('Supabase credentials missing. Operating in memory-only mode.');
}

// Initialize AI Client
let ai;
try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (err) {
  console.error("Failed to initialize AI Client:", err);
}

// Middleware to check if DB is connected
const checkDBConnection = (req, res, next) => {
  req.dbConnected = !!supabase;
  next();
};

app.post('/api/generate', checkDBConnection, async (req, res) => {
  try {
    const { primarySubject, requirements, constraints, preferences } = req.body;
    
    if (!primarySubject) {
      return res.status(400).json({ error: 'Primary Subject is required' });
    }

    const structuredPrompt = `
You are an expert marketing copywriter for Oxygen Sports.
Please write a professional, engaging product launch announcement that supports WhatsApp broadcasts, Instagram captions, and in-store announcements.

Subject / Context: ${primarySubject}
Specific Requirements: ${requirements || 'None'}
Constraints: ${constraints || 'None'}
Preferences: ${preferences || 'None'}

Format the output cleanly using Markdown, with clear headings for WhatsApp, Instagram, and In-Store. Use professional yet energetic tone suitable for a sports brand.
`;

    let aiResponse;
    
    if (!ai) {
      console.warn('AI API key missing. Falling back to Local Demo AI Mode.');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      aiResponse = `### WhatsApp Broadcast 📱\n\nHey Oxygen fam! 🏃‍♂️💨\n\nGet ready for our latest drop: **${primarySubject}**! 🚀\n\n${requirements ? requirements : 'Grab yours today and experience the difference.'}\n\nShop now: [Link]\n\n### Instagram Caption 📸\n\nLevel up your game with the brand new ${primarySubject}. ⚡\n\n${preferences ? 'Designed with your preferences in mind: ' + preferences : 'Built for maximum performance and style.'}\n\nTap the link in our bio to shop the drop! 👇\n\n#OxygenSports #NewDrop #Performance\n\n### In-Store Announcement 📣\n\nAttention shoppers! The wait is over. The new ${primarySubject} is now available in-store!\n\nHead over to our latest arrivals section to check it out today!`;
      
    } else {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: structuredPrompt,
        });
        aiResponse = response.text;
      } catch (apiErr) {
        console.error('AI API Error:', apiErr);
        return res.status(502).json({ error: 'Failed to communicate with AI provider. Ensure your API key is valid and you have internet access.' });
      }
    }

    // Save to Database
    if (!req.dbConnected) {
      return res.json({
        id: Date.now(),
        primary_subject: primarySubject,
        specific_requirements: requirements,
        constraints: constraints,
        preferences: preferences,
        structured_prompt: structuredPrompt,
        ai_response: aiResponse,
        created_at: new Date()
      });
    }

    const { data, error } = await supabase
      .from('generations')
      .insert([
        {
          primary_subject: primarySubject,
          specific_requirements: requirements || null,
          constraints: constraints || null,
          preferences: preferences || null,
          structured_prompt: structuredPrompt,
          ai_response: aiResponse
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving to database:', error);
      return res.status(500).json({ error: 'Failed to save generation to database.' });
    }
    
    return res.json({
      id: data.id,
      ai_response: aiResponse
    });
  } catch (error) {
    console.error('Unhandled error generating content:', error);
    res.status(500).json({ error: 'Internal server error while generating content.' });
  }
});

app.get('/api/history', checkDBConnection, async (req, res) => {
  if (!req.dbConnected) return res.json([]);
  
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Database query failed' });
  }
  res.json(data);
});

app.get('/api/history/:id', checkDBConnection, async (req, res) => {
  if (!req.dbConnected) return res.status(404).json({ error: 'Not found' });
  
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', req.params.id)
    .single();
    
  if (error || !data) {
    console.error('Error fetching generation:', error);
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(data);
});

app.post('/api/rating', checkDBConnection, async (req, res) => {
  const { id, rating } = req.body;
  if (!id || rating === undefined) {
    return res.status(400).json({ error: 'ID and rating are required' });
  }
  if (!req.dbConnected) return res.json({ success: true });

  const { error } = await supabase
    .from('generations')
    .update({ rating })
    .eq('id', id);
    
  if (error) {
    console.error('Error updating rating:', error);
    return res.status(500).json({ error: 'Failed to update rating in database' });
  }
  res.json({ success: true });
});

app.post('/api/copy', checkDBConnection, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  if (!req.dbConnected) return res.json({ success: true });
  
  const { error } = await supabase.from('actions').insert([{ generation_id: id, action_type: 'copy' }]);
  if (error) return res.status(500).json({ error: 'Failed' });
  res.json({ success: true });
});

app.post('/api/download', checkDBConnection, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  if (!req.dbConnected) return res.json({ success: true });
  
  const { error } = await supabase.from('actions').insert([{ generation_id: id, action_type: 'download' }]);
  if (error) return res.status(500).json({ error: 'Failed' });
  res.json({ success: true });
});

app.post('/api/export', checkDBConnection, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  if (!req.dbConnected) return res.json({ success: true });
  
  const { error } = await supabase.from('actions').insert([{ generation_id: id, action_type: 'export' }]);
  if (error) return res.status(500).json({ error: 'Failed' });
  res.json({ success: true });
});

app.get('/api/analytics', checkDBConnection, async (req, res) => {
  if (!req.dbConnected) {
    return res.json({
      totalGenerations: 0,
      averageRating: '0.0',
      qualityScore: 0,
      copyCount: 0,
      downloadCount: 0,
      exportCount: 0,
      trends: [],
      ratingDistribution: []
    });
  }

  const analyticsData = {
    totalGenerations: 0,
    averageRating: 0,
    qualityScore: 0,
    copyCount: 0,
    downloadCount: 0,
    exportCount: 0,
    trends: [],
    ratingDistribution: []
  };

  try {
    const [genRes, actionsRes] = await Promise.all([
      supabase.from('generations').select('id, rating, created_at').order('created_at', { ascending: true }),
      supabase.from('actions').select('action_type')
    ]);

    if (genRes.error) throw genRes.error;
    if (actionsRes.error) throw actionsRes.error;

    const generations = genRes.data || [];
    const actions = actionsRes.data || [];

    // Totals
    analyticsData.totalGenerations = generations.length;
    let highQualityCount = 0;
    let totalRatingSum = 0;
    let ratedCount = 0;

    let stars5 = 0, stars4 = 0, stars3 = 0, stars12 = 0;
    const trendsMap = {};

    generations.forEach(g => {
      // Trends grouping by date
      const date = new Date(g.created_at).toISOString().split('T')[0];
      trendsMap[date] = (trendsMap[date] || 0) + 1;

      // Ratings
      if (g.rating !== null && g.rating !== undefined) {
        totalRatingSum += g.rating;
        ratedCount++;
        if (g.rating >= 4) highQualityCount++;

        if (g.rating === 5) stars5++;
        else if (g.rating === 4) stars4++;
        else if (g.rating === 3) stars3++;
        else if (g.rating <= 2) stars12++;
      }
    });

    if (ratedCount > 0) {
      analyticsData.averageRating = (totalRatingSum / ratedCount).toFixed(1);
    }
    
    analyticsData.qualityScore = analyticsData.totalGenerations > 0 
      ? Math.round((highQualityCount / analyticsData.totalGenerations) * 100) 
      : 0;

    if (stars5 || stars4 || stars3 || stars12) {
      analyticsData.ratingDistribution = [
        { name: '5 Stars', value: stars5 },
        { name: '4 Stars', value: stars4 },
        { name: '3 Stars', value: stars3 },
        { name: '1-2 Stars', value: stars12 }
      ];
    }

    // Trends Array (limit to last 7 days)
    analyticsData.trends = Object.keys(trendsMap).map(date => ({
      date,
      count: trendsMap[date]
    })).slice(-7);

    // Actions
    actions.forEach(a => {
      if (a.action_type === 'copy') analyticsData.copyCount++;
      if (a.action_type === 'download') analyticsData.downloadCount++;
      if (a.action_type === 'export') analyticsData.exportCount++;
    });

    res.json(analyticsData);
  } catch (err) {
    console.error('Error calculating analytics:', err);
    res.status(500).json({ error: 'Failed to calculate analytics' });
  }
});

const PORT = process.env.PORT || 5000;

// Serve frontend static files if running in production or on Render
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
  const frontendDistPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDistPath));
  
  app.get('*', (req, res) => {
    // Only intercept non-API routes
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
}

// Don't listen if running as a Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
