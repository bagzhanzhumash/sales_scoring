#!/usr/bin/env tsx

/**
 * Comprehensive API Functionality Test Suite
 * Tests all frontend API routes and backend integration
 */

interface TestResult {
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  responseTime: number
  statusCode?: number
  error?: string
  response?: any
}

class APITester {
  private baseUrl: string
  private results: TestResult[] = []

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive API Functionality Tests\n')
    
    await this.testProjectsAPI()
    await this.testAudioFilesAPI()
    await this.testExportsAPI()
    await this.testChecklistsAPI()
    await this.testSystemAPI()
    
    this.printResults()
  }

  private async testProjectsAPI(): Promise<void> {
    console.log('📁 Testing Projects API...')
    
    // Test GET /api/v1/projects
    await this.testEndpoint('GET', '/api/v1/projects', {
      description: 'Fetch projects list'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects?status=active&page=1&limit=10&sortBy=recent', {
      description: 'Fetch projects with filters'
    })
    
    // Test POST /api/v1/projects
    await this.testEndpoint('POST', '/api/v1/projects', {
      description: 'Create new project',
      body: {
        name: 'Test Project API',
        description: 'Testing project creation via API',
        checklist_id: 'cs-quality-v1'
      }
    })
    
    // Test individual project routes
    await this.testEndpoint('GET', '/api/v1/projects/1', {
      description: 'Fetch project details'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects/1?action=checklist', {
      description: 'Fetch project checklist'
    })
    
    await this.testEndpoint('PUT', '/api/v1/projects/1?action=checklist', {
      description: 'Update project checklist',
      body: {
        name: 'Updated Checklist',
        categories: []
      }
    })
  }

  private async testAudioFilesAPI(): Promise<void> {
    console.log('🎵 Testing Audio Files API...')
    
    // Test project files
    await this.testEndpoint('GET', '/api/v1/audio-files/projects/1', {
      description: 'Fetch project audio files'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects/1/files?action=backend', {
      description: 'Fetch files from backend'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects/1/files?status=completed&search=customer&sortBy=recent', {
      description: 'Fetch files with filters'
    })
    
    // Test file processing
    await this.testEndpoint('POST', '/api/v1/projects/1/files?action=process', {
      description: 'Process audio files',
      body: {
        file_ids: ['audio-1', 'audio-2'],
        options: {
          priority: 'high',
          force_reprocess: false
        }
      }
    })
    
    // Test bulk operations
    await this.testEndpoint('POST', '/api/v1/projects/1/files?action=bulk', {
      description: 'Bulk file operations',
      body: {
        action: 'delete',
        file_ids: ['audio-3', 'audio-4']
      }
    })
    
    // Test individual file operations
    await this.testEndpoint('GET', '/api/v1/projects/1/files/audio-1', {
      description: 'Fetch individual file details'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects/1/files/audio-1?action=stream', {
      description: 'Get audio stream URL'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects/1/files/audio-1?action=download', {
      description: 'Download audio file'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects/1/files/audio-1?action=transcription', {
      description: 'Get file transcription'
    })
    
    await this.testEndpoint('GET', '/api/v1/projects/1/files/audio-1?action=analysis', {
      description: 'Get file analysis'
    })
    
    await this.testEndpoint('PUT', '/api/v1/projects/1/files/audio-1?action=reprocess', {
      description: 'Reprocess audio file',
      body: {
        force: true,
        priority: 'high'
      }
    })
    
    await this.testEndpoint('DELETE', '/api/v1/projects/1/files/audio-1', {
      description: 'Delete audio file'
    })
  }

  private async testExportsAPI(): Promise<void> {
    console.log('📊 Testing Exports API...')
    
    // Test exports list
    await this.testEndpoint('GET', '/api/v1/exports', {
      description: 'Fetch exports list'
    })
    
    await this.testEndpoint('GET', '/api/v1/exports?action=templates', {
      description: 'Fetch export templates'
    })
    
    await this.testEndpoint('GET', '/api/v1/exports?status=completed&page=1&limit=10', {
      description: 'Fetch exports with filters'
    })
    
    // Test export creation
    await this.testEndpoint('POST', '/api/v1/exports', {
      description: 'Create new export',
      body: {
        project_id: '1',
        format: 'excel',
        template: 'detailed',
        include_transcripts: true,
        include_analysis: true
      }
    })
    
    await this.testEndpoint('POST', '/api/v1/exports', {
      description: 'Create bulk export',
      body: {
        file_ids: ['audio-1', 'audio-2'],
        format: 'csv',
        template: 'summary'
      }
    })
    
    // Test individual export operations
    await this.testEndpoint('GET', '/api/v1/exports/export-1', {
      description: 'Fetch export details'
    })
    
    await this.testEndpoint('GET', '/api/v1/exports/export-1?action=status', {
      description: 'Get export status'
    })
    
    await this.testEndpoint('GET', '/api/v1/exports/export-1?action=download', {
      description: 'Download export file'
    })
    
    await this.testEndpoint('POST', '/api/v1/exports/export-3?action=retry', {
      description: 'Retry failed export'
    })
    
    await this.testEndpoint('DELETE', '/api/v1/exports/export-2', {
      description: 'Cancel export'
    })
  }

  private async testChecklistsAPI(): Promise<void> {
    console.log('📋 Testing Checklists API...')
    
    // Test checklist templates
    await this.testEndpoint('GET', '/api/v1/checklists/templates', {
      description: 'Fetch checklist templates'
    })
    
    await this.testEndpoint('GET', '/api/v1/checklists/templates?industry=automotive', {
      description: 'Fetch templates by industry'
    })
  }

  private async testSystemAPI(): Promise<void> {
    console.log('⚙️ Testing System API...')
    
    // Test system overview
    await this.testEndpoint('GET', '/api/v1/system', {
      description: 'Get system overview'
    })
    
    // Test health checks
    await this.testEndpoint('GET', '/api/v1/system?action=health', {
      description: 'System health check'
    })
    
    // Test metrics
    await this.testEndpoint('GET', '/api/v1/system?action=metrics', {
      description: 'System performance metrics'
    })
    
    // Test background tasks
    await this.testEndpoint('GET', '/api/v1/system?action=tasks', {
      description: 'Background task status'
    })
    
    // Test logs
    await this.testEndpoint('GET', '/api/v1/system?action=logs&level=error&limit=20', {
      description: 'System logs'
    })
  }

  private async testEndpoint(
    method: string, 
    endpoint: string, 
    options: {
      description: string
      body?: any
      headers?: Record<string, string>
      expectedStatus?: number
    }
  ): Promise<void> {
    const startTime = Date.now()
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }
      
      if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = JSON.stringify(options.body)
      }
      
      const response = await fetch(url, fetchOptions)
      const responseTime = Date.now() - startTime
      
      let responseData
      try {
        responseData = await response.json()
      } catch {
        responseData = await response.text()
      }
      
      const result: TestResult = {
        endpoint: `${method} ${endpoint}`,
        method,
        status: response.ok ? 'PASS' : 'FAIL',
        responseTime,
        statusCode: response.status,
        response: responseData
      }
      
      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`
      }
      
      this.results.push(result)
      
      const statusIcon = response.ok ? '✅' : '❌'
      console.log(`  ${statusIcon} ${options.description} (${responseTime}ms)`)
      
      if (!response.ok) {
        console.log(`     Error: ${result.error}`)
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      const result: TestResult = {
        endpoint: `${method} ${endpoint}`,
        method,
        status: 'FAIL',
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      }
      
      this.results.push(result)
      
      console.log(`  ❌ ${options.description} (${responseTime}ms)`)
      console.log(`     Error: ${result.error}`)
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary')
    console.log('=' .repeat(50))
    
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed} ✅`)
    console.log(`Failed: ${failed} ❌`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total
    console.log(`Average Response Time: ${avgResponseTime.toFixed(1)}ms`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  - ${result.endpoint}: ${result.error}`)
        })
    }
    
    console.log('\n🔍 Backend Integration Status:')
    const backendTests = this.results.filter(r => r.endpoint.includes('backend') || r.endpoint.includes('action=backend'))
    if (backendTests.length > 0) {
      const backendPassed = backendTests.filter(r => r.status === 'PASS').length
      console.log(`Backend API Tests: ${backendPassed}/${backendTests.length} passed`)
    } else {
      console.log('No backend-specific tests found')
    }
    
    console.log('\n🎯 API Coverage:')
    const apiGroups = {
      'Projects': this.results.filter(r => r.endpoint.includes('/projects')),
      'Audio Files': this.results.filter(r => r.endpoint.includes('/files')),
      'Exports': this.results.filter(r => r.endpoint.includes('/exports')),
      'Checklists': this.results.filter(r => r.endpoint.includes('/checklists')),
      'System': this.results.filter(r => r.endpoint.includes('/system'))
    }
    
    Object.entries(apiGroups).forEach(([group, tests]) => {
      if (tests.length > 0) {
        const groupPassed = tests.filter(t => t.status === 'PASS').length
        console.log(`  ${group}: ${groupPassed}/${tests.length} endpoints working`)
      }
    })
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester()
  tester.runAllTests().catch(console.error)
}

export { APITester } 