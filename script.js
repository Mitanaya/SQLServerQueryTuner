document.addEventListener('DOMContentLoaded', function() {
    // [Previous DOM element declarations remain the same...]

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
        
        // Parse the query to generate relevant analysis
        try {
            const analysis = analyzeQuery(sql);
            displayExecutionPlan(analysis.executionPlan);
            displayRecommendations(analysis.recommendations);
            displayStatistics(analysis.statistics);
            
            // Switch to execution plan tab
            document.querySelector('.tab-btn[data-tab="execution-plan"]').click();
        } catch (e) {
            alert('Error analyzing query: ' + e.message);
        } finally {
            // Reset button
            analyzeBtn.innerHTML = '<i class="fas fa-magic"></i> Analyze Query';
            analyzeBtn.disabled = false;
        }
    });

    // Function to analyze the query and generate results
    function analyzeQuery(sql) {
        // Parse query components
        const queryType = getQueryType(sql);
        const tables = extractTables(sql);
        const joins = detectJoins(sql);
        const whereClauses = detectWhereConditions(sql);
        const orderBy = detectOrderBy(sql);
        const hasWildcards = detectWildcards(sql);
        const hasFunctions = detectFunctions(sql);
        
        // Generate execution plan based on query analysis
        const executionPlan = generateExecutionPlan({
            queryType,
            tables,
            joins,
            whereClauses,
            orderBy,
            hasWildcards,
            hasFunctions
        });
        
        // Generate recommendations based on analysis
        const recommendations = generateRecommendations({
            queryType,
            tables,
            joins,
            whereClauses,
            orderBy,
            hasWildcards,
            hasFunctions,
            executionPlan
        });
        
        // Generate statistics based on analysis
        const statistics = generateStatistics({
            queryType,
            tables,
            joins,
            executionPlan
        });
        
        return {
            executionPlan,
            recommendations,
            statistics
        };
    }
    
    // Helper function to determine query type
    function getQueryType(sql) {
        if (sql.match(/^\s*SELECT/i)) return 'SELECT';
        if (sql.match(/^\s*INSERT/i)) return 'INSERT';
        if (sql.match(/^\s*UPDATE/i)) return 'UPDATE';
        if (sql.match(/^\s*DELETE/i)) return 'DELETE';
        return 'UNKNOWN';
    }
    
    // Helper function to extract tables from query
    function extractTables(sql) {
        const fromMatch = sql.match(/FROM\s+([^\s,(]+)/i);
        const joinMatches = [...sql.matchAll(/JOIN\s+([^\s,(]+)/gi)];
        
        const tables = [];
        if (fromMatch && fromMatch[1]) {
            tables.push(fromMatch[1].replace(/\[|\]/g, ''));
        }
        
        joinMatches.forEach(match => {
            if (match[1]) {
                tables.push(match[1].replace(/\[|\]/g, ''));
            }
        });
        
        return [...new Set(tables)]; // Remove duplicates
    }
    
    // Helper function to detect joins
    function detectJoins(sql) {
        const joinConditions = [...sql.matchAll(/ON\s+(.+?)(?=\s+(WHERE|GROUP BY|HAVING|ORDER BY|$))/gi)];
        return joinConditions.map(j => j[1].trim());
    }
    
    // Helper function to detect WHERE conditions
    function detectWhereConditions(sql) {
        const whereMatch = sql.match(/WHERE\s+(.+?)(?=\s+(GROUP BY|HAVING|ORDER BY|$))/i);
        return whereMatch ? whereMatch[1].trim().split(/\s+AND\s+|\s+OR\s+/i) : [];
    }
    
    // Helper function to detect ORDER BY
    function detectOrderBy(sql) {
        const orderByMatch = sql.match(/ORDER BY\s+(.+?)(?=\s*$)/i);
        return orderByMatch ? orderByMatch[1].trim() : null;
    }
    
    // Helper function to detect wildcards
    function detectWildcards(sql) {
        return sql.includes('*') || sql.match(/%.+?%/i);
    }
    
    // Helper function to detect functions
    function detectFunctions(sql) {
        return [...sql.matchAll(/(\w+)\(/g)].map(m => m[1]);
    }
    
    // Generate execution plan based on query analysis
    function generateExecutionPlan(analysis) {
        const operations = [];
        let totalCost = 0;
        const warnings = [];
        
        // Add table scan operations
        analysis.tables.forEach(table => {
            const cost = 30 + Math.floor(Math.random() * 30);
            totalCost += cost;
            operations.push({
                id: operations.length + 1,
                type: "SCAN",
                cost: cost,
                description: `Table scan on ${table}`
            });
            
            // Check if table has indexes defined
            const tableCards = document.querySelectorAll('.table-card h3');
            const hasIndexes = Array.from(tableCards).some(card => 
                card.textContent.toLowerCase() === table.toLowerCase()
            );
            
            if (!hasIndexes) {
                warnings.push(`Table ${table} has no indexes defined - consider adding appropriate indexes`);
            }
        });
        
        // Add join operations if present
        if (analysis.joins.length > 0) {
            analysis.joins.forEach(join => {
                const cost = 20 + Math.floor(Math.random() * 20);
                totalCost += cost;
                operations.push({
                    id: operations.length + 1,
                    type: "JOIN",
                    cost: cost,
                    description: `Join operation: ${join}`
                });
                
                // Check if join columns are indexed
                const joinColumns = join.split('=').map(part => {
                    const parts = part.trim().split('.');
                    return parts.length > 1 ? parts[1] : null;
                }).filter(Boolean);
                
                joinColumns.forEach(col => {
                    if (!isColumnIndexed(col, analysis.tables)) {
                        warnings.push(`Join column ${col} may benefit from an index`);
                    }
                });
            });
        }
        
        // Add WHERE clause operations
        if (analysis.whereClauses.length > 0) {
            analysis.whereClauses.forEach(condition => {
                const cost = 10 + Math.floor(Math.random() * 10);
                totalCost += cost;
                operations.push({
                    id: operations.length + 1,
                    type: "FILTER",
                    cost: cost,
                    description: `Filter condition: ${condition}`
                });
                
                // Check if filtered columns are indexed
                const columnMatch = condition.match(/(\w+)\s*[=<>!]/);
                if (columnMatch && columnMatch[1]) {
                    const column = columnMatch[1];
                    if (!isColumnIndexed(column, analysis.tables)) {
                        warnings.push(`Filtered column ${column} may benefit from an index`);
                    }
                }
            });
        }
        
        // Add ORDER BY operation if present
        if (analysis.orderBy) {
            const cost = 15 + Math.floor(Math.random() * 15);
            totalCost += cost;
            operations.push({
                id: operations.length + 1,
                type: "SORT",
                cost: cost,
                description: `Sort operation: ORDER BY ${analysis.orderBy}`
            });
            
            // Check if sorted columns are indexed
            const sortColumns = analysis.orderBy.split(',').map(col => col.trim().split(' ')[0]);
            sortColumns.forEach(col => {
                if (!isColumnIndexed(col, analysis.tables)) {
                    warnings.push(`Sorted column ${col} may benefit from an index`);
                }
            });
        }
        
        // Add warning for wildcards if present
        if (analysis.hasWildcards) {
            warnings.push("Wildcard characters (%) in LIKE conditions can lead to table scans - consider more specific patterns");
        }
        
        // Add warning for functions if present
        if (analysis.hasFunctions.length > 0) {
            warnings.push(`Functions (${analysis.hasFunctions.join(', ')}) in WHERE clauses can prevent index usage`);
        }
        
        return {
            operations,
            totalCost,
            warnings: [...new Set(warnings)] // Remove duplicates
        };
    }
    
    // Helper function to check if a column is indexed
    function isColumnIndexed(column, tables) {
        if (!column) return false;
        
        const tableCards = document.querySelectorAll('.table-card');
        for (const card of tableCards) {
            const tableName = card.querySelector('h3').textContent;
            if (tables.includes(tableName)) {
                const indexDefs = card.querySelector('pre').textContent;
                if (indexDefs.includes(column)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Generate recommendations based on analysis
    function generateRecommendations(analysis) {
        const recommendations = [];
        
        // Index recommendations
        analysis.tables.forEach(table => {
            const tableCards = document.querySelectorAll('.table-card h3');
            const hasIndexes = Array.from(tableCards).some(card => 
                card.textContent.toLowerCase() === table.toLowerCase()
            );
            
            if (!hasIndexes) {
                recommendations.push({
                    type: "index",
                    severity: "high",
                    description: `Table ${table} has no indexes defined - consider adding a clustered index`,
                    code: `CREATE CLUSTERED INDEX PK_${table} ON ${table}(ID); -- Replace ID with actual primary key`
                });
            }
        });
        
        // Join column recommendations
        analysis.joins.forEach(join => {
            const joinColumns = join.split('=').map(part => {
                const parts = part.trim().split('.');
                return parts.length > 1 ? parts[1] : null;
            }).filter(Boolean);
            
            joinColumns.forEach(col => {
                if (!isColumnIndexed(col, analysis.tables)) {
                    const table = findTableForColumn(col, analysis.tables);
                    if (table) {
                        recommendations.push({
                            type: "index",
                            severity: "high",
                            description: `Join column ${col} in table ${table} may benefit from an index`,
                            code: `CREATE NONCLUSTERED INDEX IX_${table}_${col} ON ${table}(${col});`
                        });
                    }
                }
            });
        });
        
        // WHERE clause recommendations
        analysis.whereClauses.forEach(condition => {
            const columnMatch = condition.match(/(\w+)\s*[=<>!]/);
            if (columnMatch && columnMatch[1]) {
                const column = columnMatch[1];
                if (!isColumnIndexed(column, analysis.tables)) {
                    const table = findTableForColumn(column, analysis.tables);
                    if (table) {
                        recommendations.push({
                            type: "index",
                            severity: "medium",
                            description: `Filtered column ${column} in table ${table} may benefit from an index`,
                            code: `CREATE NONCLUSTERED INDEX IX_${table}_${column} ON ${table}(${column});`
                        });
                    }
                }
            }
        });
        
        // ORDER BY recommendations
        if (analysis.orderBy) {
            const sortColumns = analysis.orderBy.split(',').map(col => col.trim().split(' ')[0]);
            sortColumns.forEach(col => {
                if (!isColumnIndexed(col, analysis.tables)) {
                    const table = findTableForColumn(col, analysis.tables);
                    if (table) {
                        recommendations.push({
                            type: "index",
                            severity: "medium",
                            description: `Sorted column ${col} in table ${table} may benefit from an index`,
                            code: `CREATE NONCLUSTERED INDEX IX_${table}_${col} ON ${table}(${col});`
                        });
                    }
                }
            });
        }
        
        // Query structure recommendations
        if (analysis.hasWildcards) {
            recommendations.push({
                type: "query",
                severity: "medium",
                description: "Wildcard characters (%) at the beginning of LIKE patterns prevent index usage",
                code: "Consider: WHERE column LIKE 'prefix%' instead of WHERE column LIKE '%search%'"
            });
        }
        
        if (analysis.hasFunctions.length > 0) {
            recommendations.push({
                type: "query",
                severity: "medium",
                description: "Functions in WHERE clauses can prevent index usage",
                code: "Consider: WHERE column = value instead of WHERE FUNCTION(column) = value"
            });
        }
        
        if (analysis.executionPlan.totalCost > 100) {
            recommendations.push({
                type: "query",
                severity: "low",
                description: "High cost query - consider reviewing the overall structure",
                code: "Consider simplifying the query or breaking it into smaller parts"
            });
        }
        
        return [...new Set(recommendations)]; // Remove duplicates
    }
    
    // Helper function to find table for a column
    function findTableForColumn(column, tables) {
        // In a real implementation, you'd need schema information
        // For this demo, we'll just return the first table
        return tables.length > 0 ? tables[0] : null;
    }
    
    // Generate statistics based on analysis
    function generateStatistics(analysis) {
        const baseTime = 50 + Math.floor(Math.random() * 100);
        const joinPenalty = analysis.joins.length * 30;
        const wherePenalty = analysis.whereClauses.length * 10;
        const sortPenalty = analysis.orderBy ? 40 : 0;
        
        const estimatedTime = baseTime + joinPenalty + wherePenalty + sortPenalty;
        const actualTime = estimatedTime * (0.8 + Math.random() * 0.4); // ±20% variation
        
        return {
            estimatedRows: 1000 + Math.floor(Math.random() * 9000),
            actualRows: 1000 + Math.floor(Math.random() * 9000),
            estimatedExecutionTime: `${estimatedTime}ms`,
            actualExecutionTime: `${Math.round(actualTime)}ms`,
            memoryGrant: `${512 + Math.floor(Math.random() * 1024)}KB`,
            cpuTime: `${Math.round(estimatedTime * 0.7)}ms`,
            logicalReads: 100 + Math.floor(Math.random() * 1000)
        };
    }

    // [Rest of the code remains the same...]
});
