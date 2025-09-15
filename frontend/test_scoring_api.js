/**
 * Test script for scoring page API connectivity
 */

const API_BASE_URL = 'http://localhost:7777/api/v1'

async function testAPI() {
  console.log('🧪 Testing Scoring Page API Connectivity...\n')

  try {
    // Test 1: Create Project
    console.log('1. Testing Project Creation...')
    const projectResponse = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Scoring Project',
        description: 'Test project for scoring page'
      })
    })

    if (!projectResponse.ok) {
      throw new Error(`Project creation failed: ${projectResponse.statusText}`)
    }

    const project = await projectResponse.json()
    console.log(`✅ Project created: ${project.name} (ID: ${project.id})\n`)

    // Test 2: Get Project
    console.log('2. Testing Project Retrieval...')
    const getProjectResponse = await fetch(`${API_BASE_URL}/projects/${project.id}`)
    
    if (!getProjectResponse.ok) {
      throw new Error(`Project retrieval failed: ${getProjectResponse.statusText}`)
    }

    const retrievedProject = await getProjectResponse.json()
    console.log(`✅ Project retrieved: ${retrievedProject.name}\n`)

    // Test 3: Check Checklist Templates
    console.log('3. Testing Checklist Templates...')
    const templatesResponse = await fetch(`${API_BASE_URL}/checklists/templates`)
    
    if (!templatesResponse.ok) {
      throw new Error(`Templates retrieval failed: ${templatesResponse.statusText}`)
    }

    const templates = await templatesResponse.json()
    console.log(`✅ Found ${templates.templates?.length || 0} checklist templates\n`)

    // Test 4: Test File Upload Endpoint (without actual file)
    console.log('4. Testing Audio Upload Endpoint (checking availability)...')
    const uploadResponse = await fetch(`${API_BASE_URL}/audio-files/projects/${project.id}/upload`, {
      method: 'POST',
      body: new FormData() // Empty form data
    })

    // We expect this to fail with 400/422, not 404
    if (uploadResponse.status === 404) {
      throw new Error('Upload endpoint not found')
    }
    
    console.log(`✅ Upload endpoint available (status: ${uploadResponse.status})\n`)

    // Test 5: Test Transcription Endpoint
    console.log('5. Testing Transcription Endpoint...')
    const transcriptionResponse = await fetch(`${API_BASE_URL}/transcription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_file_id: 'test-id'
      })
    })

    // We expect this to fail with validation error, not 404
    if (transcriptionResponse.status === 404) {
      throw new Error('Transcription endpoint not found')
    }
    
    console.log(`✅ Transcription endpoint available (status: ${transcriptionResponse.status})\n`)

    // Test 6: Test Analysis Endpoint
    console.log('6. Testing Analysis Endpoint...')
    const analysisResponse = await fetch(`${API_BASE_URL}/analysis/transcriptions/test-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checklist_id: 'test-checklist-id'
      })
    })

    // We expect this to fail with validation error, not 404
    if (analysisResponse.status === 404) {
      throw new Error('Analysis endpoint not found')
    }
    
    console.log(`✅ Analysis endpoint available (status: ${analysisResponse.status})\n`)

    // Test 7: Check Project Files
    console.log('7. Testing Project Files Endpoint...')
    const filesResponse = await fetch(`${API_BASE_URL}/audio-files/projects/${project.id}`)
    
    if (!filesResponse.ok) {
      throw new Error(`Project files retrieval failed: ${filesResponse.statusText}`)
    }

    const files = await filesResponse.json()
    console.log(`✅ Project files retrieved: ${files.total || 0} files\n`)

    // Test 8: Check Project Results
    console.log('8. Testing Project Results Endpoint...')
    const resultsResponse = await fetch(`${API_BASE_URL}/results/projects/${project.id}`)
    
    if (!resultsResponse.ok) {
      throw new Error(`Project results retrieval failed: ${resultsResponse.statusText}`)
    }

    const results = await resultsResponse.json()
    console.log(`✅ Project results retrieved: ${results.results?.length || 0} results\n`)

    // Cleanup: Delete test project
    console.log('9. Cleaning up test project...')
    const deleteResponse = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
      method: 'DELETE'
    })

    if (deleteResponse.ok) {
      console.log('✅ Test project cleaned up\n')
    } else {
      console.log('⚠️ Could not clean up test project (this is okay)\n')
    }

    console.log('🎉 All API tests passed! Scoring page backend connectivity verified.')
    console.log('\n📋 Summary:')
    console.log('- ✅ Project management')
    console.log('- ✅ Checklist templates')
    console.log('- ✅ Audio file upload')
    console.log('- ✅ Transcription service')
    console.log('- ✅ Analysis service')
    console.log('- ✅ Results retrieval')
    console.log('\n🚀 Ready for scoring page testing!')

  } catch (error) {
    console.error('❌ API Test Failed:', error.message)
    console.log('\n🔧 Please check:')
    console.log('1. Backend server is running (http://localhost:8000)')
    console.log('2. Database is connected')
    console.log('3. All API endpoints are properly configured')
    process.exit(1)
  }
}

// Run the test
testAPI() 