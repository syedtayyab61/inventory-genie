// Simple cloud storage using GitHub Gist API
const GIST_TOKEN = ''; // Users should add their own token here
const GIST_ID = 'inventory-genie-data';

export const saveToCloud = async (data) => {
  try {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${GIST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Inventory Genie Data',
        public: false,
        files: {
          'inventory-data.json': {
            content: JSON.stringify(data)
          }
        }
      })
    });
    const result = await response.json();
    return result.id;
  } catch (error) {
    return null;
  }
};

export const loadFromCloud = async (gistId) => {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`);
    const result = await response.json();
    return JSON.parse(result.files['inventory-data.json'].content);
  } catch (error) {
    return null;
  }
};