// Azure OpenAI Configuration
// Values are read from environment variables (VITE_ prefix for Vite)
// Create a .env file in the root directory with your API keys

export const azureConfig = {
  endpoint: import.meta.env.VITE_AZURE_ENDPOINT || '',
  apiKey: import.meta.env.VITE_AZURE_API_KEY || '',
  deploymentName: import.meta.env.VITE_AZURE_DEPLOYMENT || 'gpt-5-chat',
  apiVersion: '2025-01-01-preview',
  targetUri: import.meta.env.VITE_AZURE_TARGET_URI || ''
};

// Get Azure OpenAI configuration from environment variables
export function getAzureConfig() {
  const endpoint = import.meta.env.VITE_AZURE_ENDPOINT;
  const apiKey = import.meta.env.VITE_AZURE_API_KEY;
  const deploymentName = import.meta.env.VITE_AZURE_DEPLOYMENT;
  const targetUri = import.meta.env.VITE_AZURE_TARGET_URI;

  if (!endpoint || !apiKey || !targetUri) {
    console.warn('⚠️ Azure OpenAI configuration missing. Please check your .env file.');
    console.warn('   Make sure you have created .env with VITE_AZURE_* variables.');
  }

  return {
    endpoint: endpoint || '',
    apiKey: apiKey || '',
    deploymentName: deploymentName || 'gpt-5-chat',
    apiVersion: azureConfig.apiVersion,
    targetUri: targetUri || ''
  };
}
