"use strict";

const capacity = require('./parameters').capacity;
const isEmpty = require('../functions/helpers').isEmpty;
class TimeModule {
    constructor(number) {
        this.number = number;
        this.assignedTechnicians = Array();
        this.boss = null;
        this.conmutableWith = Array();
        this.capacity = capacity;
        this.potentialTechnicians = {};
        this.potentialBosses = Array();
    }

    hasBoss() {
        if (!this.boss) return false;
        return true;
    }

    hasPotentialTehnicians() {
        return !isEmpty(this.potentialTechnicians);
    }

    hasTechniciansWithPriority(priority) {
        if (this.potentialTechnicians.hasOwnProperty(priority)) {
            return this.potentialTechnicians[priority].length > 0;
        }
        return false;
    }

    isFullModule() {
        return this.assignedTechnicians.length >= this.capacity;
    }

    assignTechnicians() {
        let currentPriority = 1;
        while (this.hasPotentialTehnicians() && !this.isFullModule()) {
            while (this.hasTechniciansWithPriority(currentPriority)) {
                let result = this.addTechnician(currentPriority);
                if (!result) break;
            }
            delete this.potentialTechnicians[currentPriority];
            currentPriority++;
        }
    }

    addTechnician(currentPriority) {
        if (!this.isFullModule()) {
            let toAssign = this.potentialTechnicians[currentPriority].pop();
            this.assignedTechnicians.push(toAssign);
            this.checkConmutability(currentPriority, toAssign);
            toAssign.isAssigned = true;
            toAssign.isAssignedTo = this.number;
            return true;
        }
        return false;
    }


    checkConmutability(currentPriority, assigned) {
        if (this.isFullModule() && this.hasTechniciansWithPriority(currentPriority)) {
            assigned.addConmutationWith(this.potentialTechnicians[currentPriority]);
        }
        else if(! this.hasTechniciansWithPriority(currentPriority) && 
        this.hasTechniciansWithPriority(currentPriority + 1)){
            assigned.addConmutationWith(this.potentialTechnicians[currentPriority + 1]);
        }
    }

    addDefaultTechnician(technician) {
        if (!this.isFullModule()) {
            priority = technician.getPriority();
            this.potentialTechnicians[priority] = this.potentialTechnicians[priority].filter(
                techn => techn.idTechnician != technician.idTechnician);
            technician.isAssigned = true;
            this.assignedTechnicians.push(technician);
        }
    }

    addPotentialTechnician(technician, priority) {
        if (this.potentialTechnicians.hasOwnProperty(priority)) {
            this.potentialTechnicians[priority].push(technician);
        } else {
            this.potentialTechnicians[priority] = Array();
            this.potentialTechnicians[priority].push(technician);
        }
    }

    removePotentialTechnician(technician) {
        let toRemove = Array();
        Object.keys(this.potentialTechnicians).forEach(x => {
            this.potentialTechnicians[x] = this.potentialTechnicians[x].filter(
                techn => techn.idTechnician !== technician.idTechnician);
                if(!this.hasTechniciansWithPriority(x)){ toRemove.push(x);}
        });
        toRemove.forEach(x => {
            delete this.potentialTechnicians[x];
        });
    }

    assignPotentialBoss(boss){
        this.potentialBosses.push(boss);
    }

    assignBoss() {
        if(this.potentialBosses.length === 1){
            this.boss = this.potentialBosses[0];
            this.boss.assignedModules.push(this.number);
            this.boss.checkConmutability(this.assignedTechnicians.length, this);
            this.potentialBosses = Array();
            return true;
        }
        return false;
    }

    addConmutationWith(modId, bossId){
        let conmutation = {'module': modId, 'boss': bossId};
        this.conmutableWith.push(conmutation);
    }
}

class Schedule {
    constructor() {
        this.modules = new Set();
        this.moduleNodes = {};
        this.doneModules = {};
    }
    
    hasCommonModules(modules) {
        let res = false
        modules.forEach(element => {
            if(this.modules.has(element)){ 
                res =  true; return null;};

            });
        return res;
    }

    addModule(numberModule) {
        this.modules.add(numberModule);
        this.moduleNodes[numberModule] = new TimeModule(numberModule);
    }

    filterModules(modules) {
        return modules.filter(mod => this.modules.has(mod));
    }

    addPotentialTechnician(technician, moduleTime, priority) {
        this.moduleNodes[moduleTime].addPotentialTechnician(technician, priority);
    }

    getModuleWithMostTechnicians(modules, priority) {
        let maxModule = 0;
        let maxValue = 0;
        modules.forEach(element => {
            if(this.moduleNodes[element].hasTechniciansWithPriority(priority) > maxValue){
                maxModule = element;
                maxValue = this.moduleNodes[element].hasTechniciansWithPriority(priority);
            }
        });
        return maxModule;
    }

    getModulesByPriority(priority) {
        let modulesWithPriority = Array();
        Object.values(this.moduleNodes).forEach(mod => {
            if(mod.hasTechniciansWithPriority(priority)){
                modulesWithPriority.push(mod.number);
            }
        });
        return modulesWithPriority;
    }

    removeTechniciansAsPotential(technician, numberOfModule) {
        technician.modules.forEach(element => {
            if(element != numberOfModule){
                this.moduleNodes[element].removePotentialTechnician(technician);
            };
        });
    }

    assignToModule(numberOfModule) {
        let currentModule = this.moduleNodes[numberOfModule];
        currentModule.assignTechnicians();
        currentModule.assignedTechnicians.forEach(element => {
            this.removeTechniciansAsPotential(element, numberOfModule);
        });
        this.doneModules[numberOfModule] = currentModule;
        delete this.moduleNodes[numberOfModule];
    }

    filterFeasibleModules() {
        let toRemove = Array();
        Object.values(this.moduleNodes).forEach(mod => {
            if(isEmpty(mod.potentialTechnicians)) {toRemove.push(mod.number); }
        });
        toRemove.forEach(element => {delete this.moduleNodes[element];});
    }

    hasAvailableModules() {
        return !isEmpty(this.moduleNodes);
    }


    assignPotentialBoss(moduleNumber, boss){
        this.doneModules[moduleNumber].assignPotentialBoss(boss);
    }

    assignBoss(moduleSelected, boss) {
        moduleSelected.assignBoss(boss);
    }

    hasModulesUnassignedBoss() {
        let result = false;
        Object.values(this.doneModules).forEach(mod => {
            if( !mod.hasBoss()) {result = true; return undefined;}
        });
        return result;
    }

    addDefaultTechnician(technician, moduleNumber) {
        this.moduleNodes[moduleNumber].addDefaultTechnician(technician);
        if (this.moduleNodes[moduleNumber].isFullModule()) {
            this.doneModules[x] = this.moduleNodes[moduleNumber];
            delete this.moduleNodes[moduleNumber];
        }
    }

    getModulesInformation(){
        let response = Array();
        Object.values(this.doneModules).forEach(mod => {
            let id = mod.number;
            let add = {'id': id};
            add['assignedTechnicians'] = Array();
            mod.assignedTechnicians.forEach(t =>{
                add.assignedTechnicians.push(t.idTechnician);
            });
            add['boss'] = mod.boss;
            add['conmutableWith'] = mod.conmutableWith;
            response.push(add)
        });
        return response;
    }

    getSortedModules(modulesArray){
        let result = Array();
        modulesArray.forEach(mod => {
            if(this.doneModules.hasOwnProperty(mod)){result.push(this.doneModules[mod]);}
        });
        result.sort((a,b) => (a.assignedTechnicians.length > b.assignedTechnicians.length) ? 1 : 
            ((b.assignedTechnicians.length > a.assignedTechnicians.length) ? -1 : 0)); 
        return result;
    }

    totalWorkingTechnicians(){
        let counter = 0;
        Object.values(this.doneModules).forEach(mod => {
            if(mod.boss){ counter += mod.assignedTechnicians.length;}
        });
        return counter;
    }

    getTotalTechnicians(bossModules){
        let total = 0;
        bossModules.forEach(element => {
            total += this.doneModules[element].assignedTechnicians.length;
        });
        return total;
    }
}

exports.Schedule = Schedule;