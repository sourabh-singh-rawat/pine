import { ServiceResponse } from "@pine/common";
import { ProjectData } from "@pine/events";
import { IProjectActivityService } from "./IProjectActivityService";

export class ProjectActivityService implements IProjectActivityService {
  constructor() {}

  logCreatedProject = async (_payload: ProjectData) => {};

  logUpdatedProjectName = async (_payload: ProjectData) => {};

  logUpdatedProjectDescription = async (_payload: ProjectData) => {};

  getProjectActivityList = async (_id: string) => {
    return new ServiceResponse({ rows: [], filteredRowCount: 1 });
  };
}
