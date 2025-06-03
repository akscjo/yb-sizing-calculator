function calculateResults() {
    // Retrieve input values
    const throughput = parseFloat(document.getElementById('throughput').value);
    const joins = document.getElementById('joins').value;
    const readThroughput = parseFloat(document.getElementById('readThroughput').value);
    const writeThroughput = parseFloat(document.getElementById('writeThroughput').value);
    const totalDataSize = parseFloat(document.getElementById('totalDataSize').value);
    const totalIndexSize = parseFloat(document.getElementById('totalIndexSize').value);
    const faultDomain = document.getElementById('faultDomain').value;
    const environment = document.getElementById('environment').value;
    const faultTolerance = parseFloat(document.getElementById('faultTolerance').value);
    const peakCpuInput = document.getElementById('peakCpu').value;
    const maxCores = parseFloat(document.getElementById('maxCores').value);
    const deploymentLocation = document.getElementById('deploymentLocation').value;
    const singleNode = document.getElementById('singleNode').value;
    const compressionRatioInput = document.getElementById('compressionRatio').value;
    const dbConnections = parseFloat(document.getElementById('dbConnections').value);

    // Parse percentage values
    const peakCpu = parseFloat(peakCpuInput.replace('%', '')) / 100;
    const compressionRatio = parseFloat(compressionRatioInput.replace('%', '')) / 100;

    // Standard core counts array (common cloud instance core counts)
    const standardCoreCounts = [1, 2, 4, 8, 16, 32, 64, 96, 128];

    // Calculate based on the provided formulas:

    // 1. Minimum estimated cores required
    // Formula: =roundup(C4/(250+(100*(if(C5="yes",0.5,1)*(C6/C4))))*(1/C13))
    const joinsMultiplier = joins === "yes" ? 0.5 : 1;
    const readWriteRatio = readThroughput / throughput;
    const minEstimatedCores = Math.ceil(
        throughput / (250 + (100 * (joinsMultiplier * readWriteRatio))) * (1 / peakCpu)
    );

    // 2. Minimum recommended cores/node
    // Formula: =if(C11="Production", 16, 4)
    const minRecommendedCoresPerNode = environment === "Production" ? 16 : 4;

    // 3. Replication Factor
    // Formula: =(2*C12)+1
    const replicationFactor = (2 * faultTolerance) + 1;

    // 4. Recommended Cores/Node
    // Formula: =if(index('Standard Core Counts'!A1:A13,MATCH(TRUE,'Standard Core Counts'!A1:A13>(C22/C26),0))<C14,index('Standard Core Counts'!A1:A13,MATCH(TRUE,'Standard Core Counts'!A1:A13>(C22/C26),0)),C14)
    // This means: Find the first standard core count > (minEstimatedCores/replicationFactor), but if it's less than maxCores, use it, otherwise use maxCores
    const coresNeededPerNode = minEstimatedCores / replicationFactor;
    let recommendedCoresPerNode = standardCoreCounts.find(cores => cores > coresNeededPerNode);
    
    if (!recommendedCoresPerNode || recommendedCoresPerNode > maxCores) {
        recommendedCoresPerNode = maxCores;
    }

    // 5. Recommended Number of Nodes
    // Formula: =round(C22/C25,0)+(C26-mod(round(C22/C25,0),C26))
    // C22 = minEstimatedCores, C25 = recommendedCoresPerNode, C26 = replicationFactor
    const baseNodes = Math.round(minEstimatedCores / recommendedCoresPerNode);
    const modValue = baseNodes % replicationFactor;
    const recommendedNodes = baseNodes + (replicationFactor - modValue);

    // 6. Minimum amount of RAM/node
    // Formula: =C25*4 (where C25 is recommendedCoresPerNode)
    const minRamPerNode = recommendedCoresPerNode * 4;

    // 7. Connections/Node
    // Formula: =C18/C27 (C18 = dbConnections, C27 = recommendedNodes)
    const connectionsPerNode = Math.round(dbConnections / recommendedNodes);

    // 8. Average memory used for connections in GB
    // Formula: =(C18*6)/1024
    const avgConnectionMemory = Math.round(((dbConnections * 6) / 1024) * 100) / 100;

    // 9. Total Storage Required in GB
    // Formula: =(C8+C9)*C26
    const totalStorageRequired = (totalDataSize + totalIndexSize) * replicationFactor;

    // 10. Total Storage with compression factored in GB
    // Formula: =C34-(C34*C17)
    const totalStorageWithCompression = totalStorageRequired - (totalStorageRequired * compressionRatio);

    // 11. Total Storage Per Node in GB
    // Formula: =roundup(C35/C27)
    const storagePerNode = Math.ceil(totalStorageWithCompression / recommendedNodes);

    // 12. Topology description
    let topologyDescription;
    if (faultDomain === "node") {
        topologyDescription = `${recommendedNodes} nodes x ${recommendedCoresPerNode} cores per node`;
    } else {
        const nodesPerFaultDomain = recommendedNodes / replicationFactor;
        topologyDescription = `${recommendedNodes} nodes x ${recommendedCoresPerNode} cores per node x ${nodesPerFaultDomain} nodes per ${faultDomain}`;
    }

    // Debug logging to help verify calculations
    console.log('Calculation Debug:');
    console.log('Throughput:', throughput);
    console.log('Joins Multiplier:', joinsMultiplier);
    console.log('Read/Write Ratio:', readWriteRatio);
    console.log('Peak CPU:', peakCpu);
    console.log('Min Estimated Cores:', minEstimatedCores);
    console.log('Min Recommended Cores/Node:', minRecommendedCoresPerNode);
    console.log('Cores Needed Per Node:', coresNeededPerNode);
    console.log('Final Recommended Cores/Node:', recommendedCoresPerNode);
    console.log('Base Nodes:', baseNodes);
    console.log('Mod Value:', modValue);
    console.log('Replication Factor:', replicationFactor);
    console.log('Final Recommended Nodes:', recommendedNodes);
    console.log('Connections Per Node:', connectionsPerNode);
    console.log('RAM per Node (4GB per core):', minRamPerNode);

    // Update the UI with calculated values
    updateResults({
        minCores: minEstimatedCores,
        recCoresNode: minRecommendedCoresPerNode,
        minRam: minRamPerNode,
        recCores: recommendedCoresPerNode,
        repFactor: replicationFactor,
        recNodes: recommendedNodes,
        connectionsPerNode: connectionsPerNode,
        avgMem: avgConnectionMemory,
        totalStorage: Math.round(totalStorageRequired),
        totalStorageComp: Math.round(totalStorageWithCompression),
        storagePerNode: storagePerNode,
        topology: topologyDescription
    });
}

function updateResults(results) {
    // Update compute metrics
    document.getElementById('minCores').textContent = results.minCores;
    document.getElementById('recCoresNode').textContent = results.recCoresNode;
    document.getElementById('minRam').textContent = results.minRam;
    document.getElementById('recCores').textContent = results.recCores;
    document.getElementById('repFactor').textContent = results.repFactor;
    document.getElementById('recNodes').textContent = results.recNodes;
    document.getElementById('connectionsPerNode').textContent = results.connectionsPerNode;
    
    // Update memory metrics
    document.getElementById('avgMem').textContent = results.avgMem;
    
    // Update storage metrics
    document.getElementById('totalStorage').textContent = results.totalStorage.toLocaleString();
    document.getElementById('totalStorageComp').textContent = results.totalStorageComp.toLocaleString();
    document.getElementById('storagePerNode').textContent = results.storagePerNode.toLocaleString();
    
    // Update topology
    document.getElementById('topology').textContent = results.topology;
}

function clearResults() {
    // Clear all result values
    document.getElementById('minCores').textContent = '--';
    document.getElementById('recCoresNode').textContent = '--';
    document.getElementById('minRam').textContent = '--';
    document.getElementById('recCores').textContent = '--';
    document.getElementById('repFactor').textContent = '--';
    document.getElementById('recNodes').textContent = '--';
    document.getElementById('connectionsPerNode').textContent = '--';
    document.getElementById('avgMem').textContent = '--';
    document.getElementById('totalStorage').textContent = '--';
    document.getElementById('totalStorageComp').textContent = '--';
    document.getElementById('storagePerNode').textContent = '--';
    document.getElementById('topology').textContent = 'Click "Calculate" to see cluster topology';
}

function validateInputs() {
    const throughput = parseFloat(document.getElementById('throughput').value);
    const readThroughput = parseFloat(document.getElementById('readThroughput').value);
    const writeThroughput = parseFloat(document.getElementById('writeThroughput').value);
    const totalDataSize = parseFloat(document.getElementById('totalDataSize').value);
    const maxCores = parseFloat(document.getElementById('maxCores').value);
    const dbConnections = parseFloat(document.getElementById('dbConnections').value);
    const faultTolerance = parseFloat(document.getElementById('faultTolerance').value);

    if (isNaN(throughput) || throughput <= 0) {
        alert('Please enter a valid throughput value.');
        return false;
    }
    
    if (isNaN(readThroughput) || readThroughput < 0) {
        alert('Please enter a valid read throughput value.');
        return false;
    }
    
    if (isNaN(writeThroughput) || writeThroughput < 0) {
        alert('Please enter a valid write throughput value.');
        return false;
    }
    
    if (isNaN(totalDataSize) || totalDataSize <= 0) {
        alert('Please enter a valid data size.');
        return false;
    }
    
    if (isNaN(maxCores) || maxCores <= 0) {
        alert('Please enter a valid maximum cores per node value.');
        return false;
    }
    
    if (isNaN(dbConnections) || dbConnections <= 0) {
        alert('Please enter a valid number of database connections.');
        return false;
    }
    
    if (isNaN(faultTolerance) || faultTolerance < 0) {
        alert('Please enter a valid fault tolerance value.');
        return false;
    }
    
    return true;
}

// Add event listener to the calculate button
document.getElementById('calculate-button').addEventListener('click', function() {
    if (validateInputs()) {
        calculateResults();
    }
});

// Add event listener to the reset button
document.getElementById('reset-button').addEventListener('click', function() {
    clearResults();
});

// Initialize with empty results on page load
document.addEventListener('DOMContentLoaded', function() {
    clearResults();
});