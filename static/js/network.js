// Initialize visualization after data is loaded
async function initializeVisualization() {
    try {
        const response = await fetch('/static/data/career_network.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Set up SVG
        const container = document.getElementById('visualization');
        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3.select("#visualization")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Define arrow markers
        svg.append("defs").selectAll("marker")
            .data(["default", "highlighted", "indirect"])
            .enter().append("marker")
            .attr("id", d => d === "default" ? "arrowhead" : `arrowhead-${d}`)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("class", d => d);

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Create a container for all elements
        const g = svg.append("g");

        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links)
                .id(d => d.id)
                .distance(d => 120 + (d.source.type !== d.target.type ? 30 : 0))) // Reduced spacing
            .force("charge", d3.forceManyBody()
                .strength(d => d.type === "clean_energy" ? -800 : -600)) // Adjusted forces
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(50)) // Reduced collision radius
            .force("x", d3.forceX(width / 2).strength(0.08))
            .force("y", d3.forceY(height / 2).strength(0.08));

        // Create links with curves and arrows
        const link = g.append("g")
            .selectAll("path")
            .data(data.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("stroke-width", d => d.similarity * 1.5)
            .attr("marker-end", "url(#arrowhead)");


        // Create node groups
        const nodeGroup = g.append("g")
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g")
            .attr("class", "node-group");

        // Add circles to node groups
        const node = nodeGroup.append("circle")
            .attr("class", "node")
            .attr("r", 8) // Reduced node size
            .attr("fill", d => d.type === "clean_energy" ? "#2ecc71" : "#3498db");

        // Add labels to node groups with background
        const labelGroup = nodeGroup.append("g")
            .attr("class", "label-group");

        // Add white background for text
        labelGroup.append("rect")
            .attr("class", "label-background")
            .attr("x", 12) // Adjusted position
            .attr("y", -8)
            .attr("rx", 3)
            .attr("ry", 3);

        // Add text
        const label = labelGroup.append("text")
            .text(d => d.id.replace(/_/g, " ").toUpperCase())
            .attr("x", 15) // Adjusted position
            .attr("y", 3)
            .attr("class", "node-label");

        // Adjust background rectangles to fit text
        labelGroup.selectAll("rect.label-background")
            .attr("width", function() {
                return this.parentNode.querySelector("text").getBBox().width + 12;
            })
            .attr("height", 22);

        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Update the findPaths function to better handle indirect transitions
        function findPaths(startNode, maxSteps = 3) {
            const paths = [];
            const visited = new Set();

            function dfs(current, path = [], totalSimilarity = 0) {
                if (path.length >= maxSteps) return;

                visited.add(current);

                const outgoingLinks = data.links.filter(link =>
                    (link.source.id === current || link.target.id === current) &&
                    !visited.has(link.source.id === current ? link.target.id : link.source.id)
                );

                outgoingLinks.forEach(link => {
                    const nextNode = link.source.id === current ? link.target : link.source;
                    const direction = link.source.id === current ? 'forward' : 'backward';

                    const newPath = [...path, {
                        source: data.nodes.find(n => n.id === current),
                        target: nextNode,
                        similarity: link.similarity,
                        direction
                    }];

                    const newSimilarity = totalSimilarity + link.similarity;

                    if (nextNode.type === "clean_energy") {
                        // For indirect paths through lower-paying roles
                        if (path.length === 0 && nextNode.salary < startNode.salary) {
                            // Continue searching for higher-paying roles
                            dfs(nextNode.id, newPath, newSimilarity);
                        } else if (nextNode.salary > startNode.salary) {
                            // Found a path to a higher-paying role
                            paths.push({
                                steps: newPath,
                                averageSimilarity: newSimilarity / newPath.length
                            });
                        }
                    } else {
                        dfs(nextNode.id, newPath, newSimilarity);
                    }
                });

                visited.delete(current);
            }

            dfs(startNode.id);
            return paths.sort((a, b) => b.averageSimilarity - a.averageSimilarity);
        }

        // Find paths between nodes


        // Update job details
        function updateJobDetails(job) {
            const jobDetails = document.getElementById('job-details');
            jobDetails.innerHTML = `
                <h4>${job.id.replace(/_/g, " ").toUpperCase()}</h4>
                <p>Type: ${job.type.replace(/_/g, " ").toUpperCase()}</p>
                <p>Salary: $${job.salary.toLocaleString()}</p>
            `;
        }

        // Update paths list
        function updatePathsList(paths) {
            const pathsList = document.getElementById('paths-list');
            if (paths.length === 0) {
                pathsList.innerHTML = '<p>No transitions available</p>';
                return;
            }

            const directPaths = paths.filter(p => p.steps.length === 1);
            const indirectPaths = paths.filter(p => p.steps.length > 1);

            let pathsHtml = `
                <div class="stats-box mb-4">
                    <h4 class="mb-3">Transition Summary</h4>
                    <p>Direct transitions: ${directPaths.length}</p>
                    <p class="mb-0">Indirect transitions: ${indirectPaths.length}</p>
                </div>
            `;

            if (directPaths.length > 0) {
                pathsHtml += '<h4 class="mb-3">Direct Transitions</h4>';
                directPaths.forEach(path => {
                    const transition = path.steps[0];
                    pathsHtml += createTransitionHtml([transition]);
                });
            }

            if (indirectPaths.length > 0) {
                pathsHtml += '<h4 class="mt-4 mb-3">Indirect Transitions</h4>';
                indirectPaths.forEach(path => {
                    pathsHtml += createTransitionHtml(path.steps);
                });
            }

            pathsList.innerHTML = pathsHtml;
        }

        // Create transition HTML
        function createTransitionHtml(steps) {
            const totalSalaryChange = steps[steps.length - 1].target.salary - steps[0].source.salary;
            const pathSteps = steps.map(step => step.source.id.replace(/_/g, " ").toUpperCase()).join(' → ') +
                ' → ' + steps[steps.length - 1].target.id.replace(/_/g, " ").toUpperCase();

            return `
                <div class="transition-path">
                    <div class="path-steps">${pathSteps}</div>
                    <div>Steps: ${steps.length}</div>
                    <div>Salary Change:
                        <span class="salary-increase">
                            ${totalSalaryChange > 0 ? '+' : ''}$${totalSalaryChange.toLocaleString()}
                        </span>
                    </div>
                </div>
            `;
        }

        // Update highlightPaths function to properly handle both steps of indirect transitions
        function highlightPaths(paths) {
            // Reset all elements
            link.classed("highlighted", false)
                .classed("indirect-highlight", false)
                .attr("marker-end", "url(#arrowhead)");
            node.classed("highlighted", false);

            paths.forEach(path => {
                const isIndirect = path.steps.length > 1;
                const markerType = isIndirect ? "indirect" : "highlighted";

                if (isIndirect) {
                    // For indirect paths, highlight all edges in the path
                    path.steps.forEach(step => {
                        link.filter(l =>
                            (l.source.id === step.source.id && l.target.id === step.target.id)
                        )
                            .classed("indirect-highlight", true)
                            .attr("marker-end", `url(#arrowhead-${markerType})`);

                        // Highlight all nodes in the path
                        node.filter(n =>
                            n.id === step.source.id || n.id === step.target.id
                        ).classed("highlighted", true);
                    });
                } else {
                    // For direct paths, only highlight if similarity is above threshold
                    path.steps.forEach(step => {
                        if (step.similarity >= 1.62) {
                            link.filter(l =>
                                (l.source.id === step.source.id && l.target.id === step.target.id)
                            )
                                .classed("highlighted", true)
                                .attr("marker-end", `url(#arrowhead-highlighted)`);

                            node.filter(n =>
                                n.id === step.source.id || n.id === step.target.id
                            ).classed("highlighted", true);
                        }
                    });
                }
            });
        }

        // Node interaction events
        nodeGroup
            .on("mouseover", (event, d) => {
                if (d.type === "clean_energy") {
                    // For clean energy jobs, highlight all incoming transitions
                    const incomingPaths = data.links
                        .filter(link => link.target.id === d.id)
                        .map(link => ({
                            steps: [{
                                source: data.nodes.find(n => n.id === link.source.id),
                                target: d,
                                similarity: link.similarity,
                                direction: 'forward'
                            }],
                            averageSimilarity: link.similarity
                        }));
                    updateJobDetails(d);
                    updatePathsList(incomingPaths);
                    highlightPaths(incomingPaths);
                } else {
                    // For traditional jobs, find paths to clean energy jobs
                    const paths = findPaths(d);
                    updateJobDetails(d);
                    updatePathsList(paths);
                    highlightPaths(paths);
                }

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`
                    ${d.id.replace(/_/g, " ").toUpperCase()}<br/>
                    Type: ${d.type.replace(/_/g, " ").toUpperCase()}<br/>
                    Salary: $${d.salary.toLocaleString()}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                link.classed("highlighted", false)
                    .classed("indirect-highlight", false)
                    .attr("marker-end", "url(#arrowhead)");
                node.classed("highlighted", false);
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Update positions
        simulation.on("tick", () => {
            // Update link paths
            link.attr("d", d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy) * 2;
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            });

            // Update node groups
            nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;

            svg.attr("width", newWidth)
                .attr("height", newHeight);

            simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2))
                .alpha(0.3)
                .restart();
        });

        // After everything is initialized, trigger the hover effect on auto_mechanic
        setTimeout(() => {
            const autoMechanicNode = data.nodes.find(n => n.id === "auto_mechanic");
            if (autoMechanicNode) {
                const paths = findPaths(autoMechanicNode);
                updateJobDetails(autoMechanicNode);
                updatePathsList(paths);
                highlightPaths(paths);
            }
        }, 1000); // Wait 1 second for the force simulation to settle

    } catch (error) {
        console.error("Error loading career network data:", error);
        document.getElementById('visualization').innerHTML = `
            <div class="alert alert-danger">
                Error loading career network data: ${error.message}
            </div>`;
    }
}

// Initialize visualization
document.addEventListener('DOMContentLoaded', initializeVisualization);