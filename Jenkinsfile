
pipeline {
    agent {
        label 'docker-build-agent'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Test All Services') {
            steps {
                sh 'mvn -B clean verify'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    def services = [
                        'auth-service',
                        'favourite-service',
                        'inventory-service',
                        'media-service',
                        'notification-service',
                        'order-service',
                        'payment-service',
                        'product-service',
                        'promotion-service',
                        'rating-service',
                        'search-service',
                        'shipping-service',
                        'tax-service'
                    ]

                    services.each { service ->
                        stage("Build ${service}") {
                            sh """
                                docker build \
                                  -t ${service}:${IMAGE_TAG} \
                                  -t ${service}:latest \
                                  ${service}
                            """
                        }
                    }
                }
            }
        }

        stage('Verify Docker Images') {
            steps {
                script {
                    def services = [
                        'auth-service',
                        'favourite-service',
                        'inventory-service',
                        'media-service',
                        'notification-service',
                        'order-service',
                        'payment-service',
                        'product-service',
                        'promotion-service',
                        'rating-service',
                        'search-service',
                        'shipping-service',
                        'tax-service'
                    ]

                    services.each { service ->
                        sh "docker image inspect ${service}:${IMAGE_TAG} > /dev/null"
                        echo "Verified ${service}:${IMAGE_TAG}"
                    }
                }
            }
        }
    }

    post {
        always {
            junit(
                testResults: '**/target/surefire-reports/TEST-*.xml',
                allowEmptyResults: true
            )
        }

        success {
            archiveArtifacts(
                artifacts: '**/target/*.jar,!**/target/*.jar.original',
                fingerprint: true
            )

            echo 'All 13 microservice Docker images built successfully.'
        }

        failure {
            echo 'CI pipeline failed. Check the stage logs.'
        }
    }
}
