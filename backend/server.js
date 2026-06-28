require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db } = require('./db');
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
  db.getConnection((err, connection) => {
    if (err) {
      console.warn('Database connection failed, operating in memory-only mode.');
      req.dbConnected = false;
    } else {
      req.dbConnected = true;
      connection.release();
    }
    next();
  });
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

    const query = `
      INSERT INTO generations 
      (primary_subject, specific_requirements, constraints, preferences, structured_prompt, ai_response, rating) 
      VALUES (?, ?, ?, ?, ?, ?, NULL)
    `;
    
    db.query(
      query, 
      [primarySubject, requirements || null, constraints || null, preferences || null, structuredPrompt, aiResponse],
      (err, result) => {
        if (err) {
          console.error('Error saving to database:', err);
          return res.status(500).json({ error: 'Failed to save generation to database.' });
        }
        
        return res.json({
          id: result.insertId,
          ai_response: aiResponse
        });
      }
    );
  } catch (error) {
    console.error('Unhandled error generating content:', error);
    res.status(500).json({ error: 'Internal server error while generating content.' });
  }
});

app.get('/api/history', checkDBConnection, (req, res) => {
  if (!req.dbConnected) {
    return res.json([]);
  }
  const query = 'SELECT * FROM generations ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching history:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

app.get('/api/history/:id', checkDBConnection, (req, res) => {
  if (!req.dbConnected) return res.status(404).json({ error: 'Not found' });
  const query = 'SELECT * FROM generations WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching generation:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    if (results.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(results[0]);
  });
});

app.post('/api/rating', checkDBConnection, (req, res) => {
  const { id, rating } = req.body;
  if (!id || rating === undefined) {
    return res.status(400).json({ error: 'ID and rating are required' });
  }
  
  if (!req.dbConnected) return res.json({ success: true });

  const query = 'UPDATE generations SET rating = ? WHERE id = ?';
  db.query(query, [rating, id], (err, result) => {
    if (err) {
      console.error('Error updating rating:', err);
      return res.status(500).json({ error: 'Failed to update rating in database' });
    }
    res.json({ success: true });
  });
});

app.post('/api/copy', checkDBConnection, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  if (!req.dbConnected) return res.json({ success: true });
  db.query('INSERT INTO actions (generation_id, action_type) VALUES (?, ?)', [id, 'copy'], (err) => {
    if (err) return res.status(500).json({ error: 'Failed' });
    res.json({ success: true });
  });
});

app.post('/api/download', checkDBConnection, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  if (!req.dbConnected) return res.json({ success: true });
  db.query('INSERT INTO actions (generation_id, action_type) VALUES (?, ?)', [id, 'download'], (err) => {
    if (err) return res.status(500).json({ error: 'Failed' });
    res.json({ success: true });
  });
});

app.post('/api/export', checkDBConnection, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  if (!req.dbConnected) return res.json({ success: true });
  db.query('INSERT INTO actions (generation_id, action_type) VALUES (?, ?)', [id, 'export'], (err) => {
    if (err) return res.status(500).json({ error: 'Failed' });
    res.json({ success: true });
  });
});

app.get('/api/analytics', checkDBConnection, (req, res) => {
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

  const queries = {
    totals: `
      SELECT 
        COUNT(*) as total,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as high_quality
      FROM generations
    `,
    actions: `
      SELECT action_type, COUNT(*) as count 
      FROM actions 
      GROUP BY action_type
    `,
    trends: `
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM generations 
      GROUP BY DATE(created_at) 
      ORDER BY DATE(created_at) DESC 
      LIMIT 7
    `,
    ratings: `
      SELECT rating, COUNT(*) as count 
      FROM generations 
      WHERE rating IS NOT NULL 
      GROUP BY rating
    `
  };

  db.query(queries.totals, (err, totalRes) => {
    if (err) return res.status(500).json({ error: 'Database error fetching totals' });
    
    analyticsData.totalGenerations = totalRes[0].total;
    analyticsData.averageRating = totalRes[0].avg_rating ? parseFloat(totalRes[0].avg_rating).toFixed(1) : 0;
    analyticsData.qualityScore = analyticsData.totalGenerations > 0 
      ? Math.round((totalRes[0].high_quality / analyticsData.totalGenerations) * 100) 
      : 0;

    db.query(queries.actions, (err, actionRes) => {
      if (err) return res.status(500).json({ error: 'Database error fetching actions' });
      
      actionRes.forEach(row => {
        if (row.action_type === 'copy') analyticsData.copyCount = row.count;
        if (row.action_type === 'download') analyticsData.downloadCount = row.count;
        if (row.action_type === 'export') analyticsData.exportCount = row.count;
      });

      db.query(queries.trends, (err, trendRes) => {
        if (err) return res.status(500).json({ error: 'Database error fetching trends' });
        analyticsData.trends = trendRes.reverse(); // oldest first for charts

        db.query(queries.ratings, (err, ratingRes) => {
          if (err) return res.status(500).json({ error: 'Database error fetching ratings' });
          
          let stars5 = 0, stars4 = 0, stars3 = 0, stars12 = 0;
          ratingRes.forEach(r => {
            if (r.rating === 5) stars5 = r.count;
            else if (r.rating === 4) stars4 = r.count;
            else if (r.rating === 3) stars3 = r.count;
            else if (r.rating <= 2) stars12 += r.count;
          });

          if (stars5 || stars4 || stars3 || stars12) {
            analyticsData.ratingDistribution = [
              { name: '5 Stars', value: stars5 },
              { name: '4 Stars', value: stars4 },
              { name: '3 Stars', value: stars3 },
              { name: '1-2 Stars', value: stars12 }
            ];
          }

          res.json(analyticsData);
        });
      });
    });
  });
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
