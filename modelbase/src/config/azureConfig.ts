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

  console.log('🔑 Azure Config Check:', {
    hasEndpoint: !!endpoint,
    hasApiKey: !!apiKey,
    hasTargetUri: !!targetUri,
    deploymentName: deploymentName || 'gpt-5-chat',
    endpoint: endpoint ? endpoint.substring(0, 30) + '...' : 'MISSING',
    targetUri: targetUri ? targetUri.substring(0, 50) + '...' : 'MISSING'
  });

  if (!endpoint || !apiKey || !targetUri) {
    console.error('❌ Azure OpenAI configuration missing!');
    console.error('   Endpoint:', endpoint ? '✓' : '✗ MISSING');
    console.error('   API Key:', apiKey ? '✓' : '✗ MISSING');
    console.error('   Target URI:', targetUri ? '✓' : '✗ MISSING');
    console.error('   Make sure you have created .env with VITE_AZURE_* variables.');
    console.error('   Restart the dev server after creating/updating .env file!');
  }

  return {
    endpoint: endpoint || '',
    apiKey: apiKey || '',
    deploymentName: deploymentName || 'gpt-5-chat',
    apiVersion: azureConfig.apiVersion,
    targetUri: targetUri || ''
  };
}
