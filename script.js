document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sqlQueryTextarea = document.getElementById('sql-query');
    const formatBtn = document.getElementById('format-btn');
    const clearBtn = document.getElementById('clear-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const addTableBtn = document.getElementById('add-table-btn');
    const tablesContainer = document.getElementById('tables-container');
    const tableModal = document.getElementById('table-modal');
    const closeModal = document.querySelector('.close');
    const saveTableBtn = document.getElementById('save-table-btn');
    const tableNameInput = document.getElementById('table-name');
    const indexDefinitionsTextarea = document.getElementById('index-definitions');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Sample execution plan visualization (in a real app, this would come from an API)
    const sampleExecutionPlan = {
        operations: [
            { id: 1, type: "SELECT", cost: 10, description: "Retrieve data from Customers table" },
            { id: 2, type: "SCAN", cost: 45, description: "Clustered index scan on Customers" },
            { id: 3, type: "JOIN", cost: 30, description: "Hash match join with Orders table" },
            { id: 4, type: "SCAN", cost: 40, description: "Clustered index scan on Orders" }
        ],
        totalCost: 125,
        warnings: [
            "Missing index on Customers.Email column",
            "Expensive clustered index scan detected"
        ]
    };
    
    // Sample recommendations (in a real app, this would come from an API)
    const sampleRecommendations = [
        {
            type: "index",
            severity: "high",
            description: "Create a non-clustered index on Customers.Email to improve search performance",
            code: "CREATE NONCLUSTERED INDEX IX_Customers_Email ON Customers(Email);"
        },
        {
            type: "query",
            severity: "medium",
            description: "Consider using EXISTS instead of IN for better performance with large datasets",
            code: "Change: WHERE CustomerID IN (SELECT CustomerID FROM Orders)\nTo: WHERE EXISTS (SELECT 1 FROM Orders WHERE Orders.CustomerID = Customers.CustomerID)"
        },
        {
            type: "statistics",
            severity: "low",
            description: "Update statistics on the Orders table for better query optimization",
            code: "UPDATE STATISTICS Orders WITH FULLSCAN;"
        }
    ];
    
    // Sample statistics (in a real app, this would come from an API)
    const sampleStatistics = {
        estimatedRows: 12453,
        actualRows: 12876,
        estimatedExecutionTime: "245ms",
        actualExecutionTime: "432ms",
        memoryGrant: "1024KB",
        cpuTime: "312ms",
        logicalReads: 1245
    };
    
    // Format SQL button
    formatBtn.addEventListener('click', function() {
        const sql = sqlQueryTextarea.value.trim();
        if (sql) {
            try {
                // Simple formatting - in a real app you'd use a proper SQL formatter library
                let formatted = sql
                    .replace(/\b(SELECT|FROM|WHERE|JOIN|INNER|OUTER|LEFT|RIGHT|FULL|ON|AND|OR|GROUP BY|HAVING|ORDER BY|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/gi, '\n$1 ')
                    .replace(/,/g, ',\n    ')
                    .replace(/\)\s*\(/g, ')\n(');
                
                sqlQueryTextarea.value = formatted;
            } catch (e) {
                alert('Error formatting SQL: ' + e.message);
            }
        }
    });
    
    // Clear button
    clearBtn.addEventListener('click', function() {
        sqlQueryTextarea.value = '';
    });
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Modal for adding table indexes
    addTableBtn.addEventListener('click', function() {
        tableNameInput.value = '';
        indexDefinitionsTextarea.value = '';
        tableModal.style.display = 'block';
    });
    
    closeModal.addEventListener('click', function() {
        tableModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === tableModal) {
            tableModal.style.display = 'none';
        }
    });
    
    // Save table index definitions
    saveTableBtn.addEventListener('click', function() {
        const tableName = tableNameInput.value.trim();
        const indexDefinitions = indexDefinitionsTextarea.value.trim();
        
        if (!tableName) {
            alert('Please enter a table name');
            return;
        }
        
        if (!indexDefinitions) {
            alert('Please enter at least one index definition');
            return;
        }
        
        addTableCard(tableName, indexDefinitions);
        tableModal.style.display = 'none';
    });
    
    // Add a table card to the UI
    function addTableCard(tableName, indexDefinitions) {
        // Remove empty state if it exists
        const emptyState = tablesContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        const tableCard = document.createElement('div');
        tableCard.className = 'table-card';
        tableCard.innerHTML = `
            <div class="table-card-header">
                <h3>${tableName}</h3>
                <button class="delete-table" title="Remove table">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <pre>${indexDefinitions}</pre>
        `;
        
        // Add delete functionality
        const deleteBtn = tableCard.querySelector('.delete-table');
        deleteBtn.addEventListener('click', function() {
            tableCard.remove();
            
            // Show empty state if no tables left
            if (tablesContainer.children.length === 0) {
                tablesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-table"></i>
                        <p>Add tables used in your query to define their indexes</p>
                    </div>
                `;
            }
        });
        
        tablesContainer.appendChild(tableCard);
    }
    
    // Analyze button - main functionality
    analyzeBtn.addEventListener('click', function() {
        const sql = sqlQueryTextarea.value.trim();
        
        if (!sql) {
            alert('Please enter a SQL query to analyze');
            return;
        }
        
        // Show loading state
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        analyzeBtn.disabled = true;
        
        // Simulate API call with timeout
        setTimeout(function() {
            // In a real app, you would send the SQL and index definitions to a backend service
            // that connects to SQL Server and analyzes the query
            
            // For this demo, we'll use sample data
            displayExecutionPlan(sampleExecutionPlan);
            displayRecommendations(sampleRecommendations);
            displayStatistics(sampleStatistics);
            
            // Switch to execution plan tab
            document.querySelector('.tab-btn[data-tab="execution-plan"]').click();
            
            // Reset button
            analyzeBtn.innerHTML = '<i class="fas fa-magic"></i> Analyze Query';
            analyzeBtn.disabled = false;
        }, 1500);
    });
    
    // Display execution plan
    function displayExecutionPlan(plan) {
        const executionPlanTab = document.getElementById('execution-plan');
        executionPlanTab.innerHTML = `
            <div class="plan-summary">
                <h3>Query Execution Plan</h3>
                <div class="plan-metrics">
                    <div class="metric">
                        <span class="metric-label">Total Cost:</span>
                        <span class="metric-value">${plan.totalCost}</span>
                    </div>
                </div>
            </div>
            <div class="plan-operations">
                ${plan.operations.map(op => `
                    <div class="operation ${op.type.toLowerCase()}">
                        <div class="operation-header">
                            <span class="operation-type">${op.type}</span>
                            <span class="operation-cost">Cost: ${op.cost}</span>
                        </div>
                        <div class="operation-description">${op.description}</div>
                    </div>
                `).join('')}
            </div>
            ${plan.warnings && plan.warnings.length > 0 ? `
                <div class="plan-warnings">
                    <h4><i class="fas fa-exclamation-triangle"></i> Warnings</h4>
                    <ul>
                        ${plan.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        // Add some CSS for the operations
        const style = document.createElement('style');
        style.textContent = `
            .plan-operations {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 20px;
            }
            
            .operation {
                padding: 15px;
                border-radius: var(--border-radius);
                background-color: white;
                border-left: 4px solid var(--primary-color);
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .operation.scan {
                border-left-color: var(--danger-color);
            }
            
            .operation.join {
                border-left-color: var(--warning-color);
            }
            
            .operation-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .operation-type {
                color: var(--dark-color);
            }
            
            .operation-cost {
                color: var(--secondary-color);
                font-size: 0.9em;
            }
            
            .operation-description {
                color: var(--dark-gray);
            }
            
            .plan-warnings {
                margin-top: 25px;
                padding: 15px;
                background-color: #fff8e6;
                border-radius: var(--border-radius);
            }
            
            .plan-warnings h4 {
                color: var(--warning-color);
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .plan-warnings ul {
                padding-left: 20px;
            }
            
            .plan-warnings li {
                margin-bottom: 5px;
            }
            
            .plan-metrics {
                display: flex;
                gap: 20px;
                margin: 15px 0;
            }
            
            .metric {
                background-color: var(--light-color);
                padding: 10px 15px;
                border-radius: var(--border-radius);
            }
            
            .metric-label {
                font-weight: 500;
                margin-right: 8px;
            }
        `;
        executionPlanTab.appendChild(style);
    }
    
    // Display recommendations
    function displayRecommendations(recommendations) {
        const recommendationsTab = document.getElementById('recommendations');
        recommendationsTab.innerHTML = `
            <h3>Optimization Recommendations</h3>
            <p class="recommendations-intro">
                Based on the query execution plan and database schema, here are recommendations
                to improve performance:
            </p>
            <div class="recommendations-list">
                ${recommendations.map(rec => `
                    <div class="recommendation ${rec.severity}">
                        <div class="recommendation-header">
                            <span class="recommendation-type">${rec.type.toUpperCase()}</span>
                            <span class="recommendation-severity">${rec.severity.toUpperCase()}</span>
                        </div>
                        <div class="recommendation-description">${rec.description}</div>
                        <pre class="recommendation-code">${rec.code}</pre>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add some CSS for the recommendations
        const style = document.createElement('style');
        style.textContent = `
            .recommendations-intro {
                margin-bottom: 20px;
                color: var(--dark-gray);
            }
            
            .recommendations-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .recommendation {
                padding: 15px;
                border-radius: var(--border-radius);
                background-color: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .recommendation.high {
                border-left: 4px solid var(--danger-color);
            }
            
            .recommendation.medium {
                border-left: 4px solid var(--warning-color);
            }
            
            .recommendation.low {
                border-left: 4px solid var(--info-color);
            }
            
            .recommendation-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 0.9em;
            }
            
            .recommendation-type {
                color: var(--dark-color);
                font-weight: 500;
            }
            
            .recommendation-severity {
                text-transform: uppercase;
                font-weight: 600;
                font-size: 0.8em;
                padding: 2px 8px;
                border-radius: 10px;
            }
            
            .recommendation.high .recommendation-severity {
                background-color: #ffebee;
                color: var(--danger-color);
            }
            
            .recommendation.medium .recommendation-severity {
                background-color: #fff8e1;
                color: var(--warning-color);
            }
            
            .recommendation.low .recommendation-severity {
                background-color: #e1f5fe;
                color: var(--info-color);
            }
            
            .recommendation-description {
                margin-bottom: 10px;
                color: var(--dark-color);
            }
            
            .recommendation-code {
                background-color: var(--light-color);
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 13px;
                margin-top: 10px;
            }
        `;
        recommendationsTab.appendChild(style);
    }
    
    // Display statistics
    function displayStatistics(stats) {
        const statisticsTab = document.getElementById('statistics');
        statisticsTab.innerHTML = `
            <h3>Performance Statistics</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.estimatedRows}</div>
                    <div class="stat-label">Estimated Rows</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.actualRows}</div>
                    <div class="stat-label">Actual Rows</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.estimatedExecutionTime}</div>
                    <div class="stat-label">Estimated Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.actualExecutionTime}</div>
                    <div class="stat-label">Actual Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.memoryGrant}</div>
                    <div class="stat-label">Memory Grant</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.cpuTime}</div>
                    <div class="stat-label">CPU Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.logicalReads}</div>
                    <div class="stat-label">Logical Reads</div>
                </div>
            </div>
        `;
        
        // Add some CSS for the statistics
        const style = document.createElement('style');
        style.textContent = `
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            
            .stat-card {
                background-color: white;
                padding: 20px;
                border-radius: var(--border-radius);
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                text-align: center;
            }
            
            .stat-value {
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--primary-color);
                margin-bottom: 5px;
            }
            
            .stat-label {
                color: var(--secondary-color);
                font-size: 0.9rem;
            }
        `;
        statisticsTab.appendChild(style);
    }
    
    // Add some sample tables for demo purposes
    function initializeDemoData() {
        addTableCard('Customers', `CREATE CLUSTERED INDEX PK_Customers ON Customers(CustomerID);
CREATE NONCLUSTERED INDEX IX_Customers_Name ON Customers(LastName, FirstName);`);
        
        addTableCard('Orders', `CREATE CLUSTERED INDEX PK_Orders ON Orders(OrderID);
CREATE NONCLUSTERED INDEX IX_Orders_CustomerID ON Orders(CustomerID) INCLUDE (OrderDate, TotalAmount);`);
        
        sqlQueryTextarea.value = `SELECT c.CustomerID, c.FirstName, c.LastName, c.Email, 
       o.OrderID, o.OrderDate, o.TotalAmount
FROM Customers c
INNER JOIN Orders o ON c.CustomerID = o.CustomerID
WHERE c.LastName LIKE 'Smith%'
ORDER BY o.OrderDate DESC;`;
    }
    
    // Uncomment to load demo data automatically
    // initializeDemoData();
});
