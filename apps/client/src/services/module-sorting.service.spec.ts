import {TestBed} from "@angular/core/testing";

import {ModuleSortingService} from "./module-sorting.service";
import {ModuleDescription} from "../../../../libs/api-interfaces/src";

describe("ModuleSortingService", () =>
{
    let service: ModuleSortingService;
    let modules: ModuleDescription[];

    function map(modules, fn) { return Array.from(modules.map(fn)); }

    beforeEach(() =>
    {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ModuleSortingService);

        modules = [
            {name: "d", ects: 1, sws: 5, offset: 0, cycle: 1, requirements: [], category: 0},
            {name: "a", ects: 2, sws: 4, offset: 0, cycle: 1, requirements: [], category: 0},
            {name: "c", ects: 3, sws: 3, offset: 0, cycle: 1, requirements: [], category: 0},
            {name: "b", ects: 4, sws: 2, offset: 0, cycle: 1, requirements: [], category: 0},
            {name: "e", ects: 5, sws: 1, offset: 0, cycle: 1, requirements: [], category: 0},
        ]
    });

    it("should be created", () =>
    {
        expect(service).toBeTruthy();
    });

    it("lexicalModuleSortFn should sort lexically", () =>
    {
        modules.sort(service.lexicalModuleSortFn.bind(service));

        expect(map(modules, m => m.name)).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("moduleSortFn should sort by sortKey", () =>
    {
        modules[1].sortKey = 1;
        modules[4].sortKey = 5;

        modules.sort(service.moduleSortFn.bind(service));

        expect(map(modules, m => m.name)).toEqual(["b", "c", "d", "a", "e"]);
    });

    it("applySortKeys should work", () =>
    {
        service.applySortKeys(modules);

        expect(map(modules, m => m.sortKey)).toEqual([0, 1, 2, 3, 4]);
    });

    it("reduceSortKeys should work", () =>
    {
        for (let i = 0; i < modules.length; i++) modules[i].sortKey = (modules[i].name as string).charCodeAt(0) - "a".charCodeAt(0);
        service.reduceSortKeys(modules);

        expect(map(modules, m => m.sortKey)).toEqual([undefined, undefined, undefined, undefined, undefined]);
    })
});
