   var queriesEl = document.getElementById("queries");
        var addEl = document.getElementById("add");
        var moreEl = document.getElementById("more");
        var lastId;

        var devices = new mbedCloudSDK.DeviceDirectoryApi(window.config);

        // Dom element builder
        function buildElement(type, value, parent, attributes) {
            var element = document.createElement(type);
            if (value) element.innerHTML = value;
            if (parent) parent.appendChild(element);
            return element;
        }

        // List queries
        function listQueries(after) {
            devices.listQueries({
                include: ["totalCount"],
                order: "DESC",
                after: after,
                limit: 10
            }, function(error, response) {
                if (error) return alert(error.message);

                response.data.forEach(function(query) {

                    // Build UI
                    var queryRow = queriesEl.insertRow();
                    buildElement("td", query.name, queryRow);
                    buildElement("td", new Date(query.createdAt).toUTCString(), queryRow);
                    var buttonCell = buildElement("td", null, queryRow);
                    var runBtn = buildElement("button", "run", buttonCell);
                    var renameBtn = buildElement("button", "rename...", buttonCell);
                    var editBtn = buildElement("button", "edit...", buttonCell);
                    var deleteBtn = buildElement("button", "delete", buttonCell);
                    var devicesRows = [];

                    // Run query
                    runBtn.addEventListener("click", function() {
                        while(devicesRows.length > 0) queriesEl.removeChild(devicesRows.pop());
                        devices.listDevices({
                            include: ["totalCount"],
                            order: "ASC",
                            limit: 100,
                            filter: query.filter,
                        }, function(error, response) {
                            if (error) return alert(error.message);

                            if (response.data.length === 0) {
                                var value = "No devices found";
                                var devicesRow = queriesEl.insertRow(queryRow.rowIndex);
                                buildElement("td", "&nbsp;", devicesRow);
                                var deviceCell = buildElement("td", value, devicesRow);
                                devicesRows.push(devicesRow);
                                deviceCell.colSpan = "2"
                            }

                            response.data.forEach(function(device) {

                                // Build UI
                                var value = "└&nbsp;" + device.id + "&nbsp;-&nbsp;" + device.state;
                                var devicesRow = queriesEl.insertRow(queryRow.rowIndex);
                                buildElement("td", "&nbsp;", devicesRow);
                                var deviceCell = buildElement("td", value, devicesRow);
                                devicesRows.push(devicesRow);
                                deviceCell.colSpan = "2"
                            });
                        });
                    });

                    // Rename query
                    renameBtn.addEventListener("click", function() {
                        var name = window.prompt("Enter a new name for the query", query.name);
                        if (!name) return;

                        devices.updateQuery({
                            id: query.id,
                            name: name
                        }, function(error) {
                            if (error) alert(error.message);
                            else location.reload()
                        });
                    });

                    // Edit query
                    editBtn.addEventListener("click", function() {
                        var state = window.prompt("Enter a new state for the filter (unenrolled, cloud_enrolling, bootstrapped, registered, deregistered)", query.filter.state.$eq || "bootstrapped");
                        if (!state) return;

                        devices.updateQuery({
                            id: query.id,
                            filter: {
                                state: { $eq: state }
                            }
                        }, function(error) {
                            if (error) alert(error.message);
                            else location.reload();
                        });
                    });

                    // Delete query
                    deleteBtn.addEventListener("click", function() {
                        if (confirm("Are you sure you want to delete query:\n" + (query.name || query.id))) {
                            query.delete(function(error) {
                                if (error) alert(error.message);
                                else location.reload()
                            });
                        }
                    });
                });

                moreEl.disabled = !response.hasMore;
                var lastQuery = response.data.slice(-1).pop();
                lastId = lastQuery.id;
            });
        }

        // Add new query
        addEl.addEventListener("click", function() {
            var name = window.prompt("Enter a name for the query", "myQuery");
            if (!name) return;

            var state = window.prompt("Enter a state to filter on (unenrolled, cloud_enrolling, bootstrapped, registered, deregistered)", "bootstrapped");
            if (!state) return;

            devices.addQuery({
                name: name,
                filter: {
                    state: { $eq: state }
                }
            }, function(error) {
                if (error) alert(error.message);
                else location.reload()
            });
        });

        // Page devices
        moreEl.addEventListener("click", function() {
            listQueries(lastId);
        });

        listQueries();