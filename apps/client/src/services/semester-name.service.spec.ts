import { TestBed } from "@angular/core/testing";

import { SemesterNameService } from "./semester-name.service";
import {SemesterName} from "@vp/api-interfaces";

describe("SemesterNameService", () =>
{
    let service: SemesterNameService;
    let semester: SemesterName;

    beforeEach(() =>
    {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SemesterNameService);
        semester = {term: "summer", year: 2021};
    });

    it("should be created", () =>
    {
        expect(service).toBeTruthy();
    });

    it("offset works with zero offset", () =>
    {
        let offSem = service.offset(semester, 0);
        expect(offSem.term).toBe("summer");
        expect(offSem.year).toBe(2021);
    })

    it("offset works with positive offset", () =>
    {
        let offSem = service.offset(semester, 3);
        expect(offSem.term).toBe("winter");
        expect(offSem.year).toBe(2022);
    })

    it("offset works with negative offset", () =>
    {
        let offSem = service.offset(semester, -3);
        expect(offSem.term).toBe("winter");
        expect(offSem.year).toBe(2019);
    })

    it("format should return non-null string", () =>
    {
        expect(service.format(semester)).toBeTruthy();
    })

    it("format should apply offset", () =>
    {
        expect(service.format(semester, 3)).not.toBe(service.format(semester));
    })

    it("currentSemester should return non-null semester name", () =>
    {
        expect(service.currentSemester()).toBeTruthy();
    })

    it("lowerThan should work", () =>
    {
        expect(service.lowerThan(semester, {term: "winter", year: 2020})).toBe(false);
        expect(service.lowerThan(semester, {term: "summer", year: 2020})).toBe(false);
        expect(service.lowerThan(semester, {term: "summer", year: 2021})).toBe(false);
        expect(service.lowerThan(semester, {term: "winter", year: 2021})).toBe(true);
        expect(service.lowerThan(semester, {term: "summer", year: 2023})).toBe(true);
    })

    it("relativeOffset works", () =>
    {
        expect(service.relativeOffset(semester, {term: "winter", year: 2020})).toBe(-1);
        expect(service.relativeOffset(semester, {term: "summer", year: 2020})).toBe(-2);
        expect(service.relativeOffset(semester, {term: "summer", year: 2021})).toBe(0);
        expect(service.relativeOffset(semester, {term: "winter", year: 2021})).toBe(1);
        expect(service.relativeOffset(semester, {term: "summer", year: 2023})).toBe(4);
    })
});
