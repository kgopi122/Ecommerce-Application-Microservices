
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
        GHCR_OWNER = 'kgopi122'
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

        stage('Publish Images to GHCR') {
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

                    withCredentials([
                        usernamePassword(
                            credentialsId: 'ghcr-credentials',
                            usernameVariable: 'GHCR_USER',
                            passwordVariable: 'GHCR_TOKEN'
                        )
                    ]) {
                        sh '''
                            set +x
                            echo "$GHCR_TOKEN" | docker login ghcr.io \
                                -u "$GHCR_USER" --password-stdin
                        '''

                        try {
                            services.each { service ->
                                def image = "ghcr.io/${GHCR_OWNER}/${service}"

                                sh """
                                    docker tag ${service}:${IMAGE_TAG} ${image}:${IMAGE_TAG}
                                    docker tag ${service}:${IMAGE_TAG} ${image}:latest

                                    docker push ${image}:${IMAGE_TAG}
                                    docker push ${image}:latest
                                """

                                echo "Published ${image}:${IMAGE_TAG}"
                            }
                        } finally {
                            sh 'docker logout ghcr.io'
                        }
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

            echo 'All 13 microservice Docker images built and published successfully to GHCR.'
        }

        failure {
            echo 'CI pipeline failed. Check the stage logs.'
        }
    }
}
